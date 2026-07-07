const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const { ObjectId } = require('mongodb');
const { connectDB, getDB, closeDB } = require('./db');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3003;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004/events/queue';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const SERVICE_NAME = 'resource-service';

function securityLog(event, details = {}) {
  console.warn(
    JSON.stringify({
      level: 'warn',
      type: 'security',
      service: SERVICE_NAME,
      event,
      at: new Date().toISOString(),
      ...details,
    })
  );
}

function hasSuspiciousContent(value) {
  if (Array.isArray(value)) return value.some((entry) => hasSuspiciousContent(entry));
  if (value && typeof value === 'object') {
    return Object.entries(value).some(([key, entryValue]) => key.includes('$') || key.includes('.') || hasSuspiciousContent(entryValue));
  }

  if (typeof value === 'string') {
    return /[<>]|[\u0000-\u001F\u007F]/.test(value);
  }

  return false;
}

app.use(cors());
app.use(helmet());
app.use(express.json());

function sanitizeObjectKeys(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizeObjectKeys(item));
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, entryValue]) => {
      const safeKey = key.replace(/\$/g, '').replace(/\./g, '');
      if (!safeKey) return accumulator;
      accumulator[safeKey] = sanitizeObjectKeys(entryValue);
      return accumulator;
    }, {});
  }

  if (typeof value === 'string') {
    return value.replace(/[<>]/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
  }

  return value;
}

app.use((req, res, next) => {
  const suspiciousBody = req.body && typeof req.body === 'object' && hasSuspiciousContent(req.body);
  const suspiciousQuery = req.query && typeof req.query === 'object' && hasSuspiciousContent(req.query);
  if (suspiciousBody || suspiciousQuery) {
    securityLog('input.sanitized', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
  }

  if (req.body && typeof req.body === 'object') req.body = sanitizeObjectKeys(req.body);
  if (req.query && typeof req.query === 'object') req.query = sanitizeObjectKeys(req.query);
  next();
});

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

function sanitizeInput(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
}

function sanitizeUnknownValue(value) {
  if (typeof value === 'string') return sanitizeInput(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeUnknownValue(item));
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((accumulator, [key, entryValue]) => {
      const sanitizedKey = sanitizeInput(key);
      if (!sanitizedKey) return accumulator;
      accumulator[sanitizedKey] = sanitizeUnknownValue(entryValue);
      return accumulator;
    }, {});
  }
  return value;
}

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    securityLog('auth.missing_token', { method: req.method, path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'Authentication required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      securityLog('auth.invalid_token', { method: req.method, path: req.path, ip: req.ip });
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    req.user = payload;
    next();
  });
}

async function publishEvent(type, resource) {
  try {
    await fetch(NOTIFICATION_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, resource }),
    });
  } catch (error) {
    console.error(`[resource] failed to publish event ${type}`, error);
  }
}

function parseListInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInput(item)).filter(Boolean);
  }

  if (typeof value !== 'string') return [];
  return value
    .split(/\n|\r\n/)
    .map((item) => sanitizeInput(item))
    .filter(Boolean);
}

function parseNutritionInput(value) {
  if (!value) return {};
  if (typeof value === 'object') return sanitizeUnknownValue(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') return sanitizeUnknownValue(parsed);
    } catch {
      // Fall through to plain-text parsing.
    }

    return trimmed
      .split(/\n|;|,/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .reduce((accumulator, entry) => {
        const separatorIndex = entry.search(/[:=]/);
        if (separatorIndex === -1) return accumulator;

        const key = entry.slice(0, separatorIndex).trim();
        const rawValue = entry.slice(separatorIndex + 1).trim();
        if (!key || !rawValue) return accumulator;

        const numericValue = /^-?\d+(\.\d+)?$/.test(rawValue) ? Number(rawValue) : rawValue;
        accumulator[key] = numericValue;
        return accumulator;
      }, {});
  }
  return {};
}

function validateResourcePayload(payload) {
  const title = sanitizeInput(payload?.title || '');
  const description = sanitizeInput(payload?.description || '');
  const cuisine = sanitizeInput(payload?.cuisine || '');
  const diet = sanitizeInput(payload?.diet || '');
  const mealType = sanitizeInput(payload?.meal_type || '');
  const prepTime = sanitizeInput(payload?.prep_time || '');
  const cookTime = sanitizeInput(payload?.cook_time || '');
  const servings = sanitizeInput(payload?.servings || '');
  const image = sanitizeInput(payload?.image || '');
  const ingredients = parseListInput(payload?.ingredients);
  const instructions = parseListInput(payload?.instructions);
  const nutrition = parseNutritionInput(payload?.nutrition);
  const prepTimeNumber = Number(prepTime);
  const cookTimeNumber = Number(cookTime);
  const servingsNumber = Number(servings);

  if (!title || !description || !cuisine || !diet || !mealType || !prepTime || !cookTime || !servings || !image || ingredients.length === 0 || instructions.length === 0) {
    return { error: 'All fields are required except nutrition.' };
  }

  if (title.length < 3) {
    return { error: 'title must contain at least 3 characters.' };
  }

  if (description.length < 10) {
    return { error: 'description must contain at least 10 characters.' };
  }

  if (!/^https?:\/\/.+/.test(image)) {
    return { error: 'image must be a valid URL starting with http:// or https://.' };
  }

  if (!Number.isInteger(prepTimeNumber) || prepTimeNumber <= 0) {
    return { error: 'prep_time must be a positive integer.' };
  }

  if (!Number.isInteger(cookTimeNumber) || cookTimeNumber <= 0) {
    return { error: 'cook_time must be a positive integer.' };
  }

  if (!Number.isInteger(servingsNumber) || servingsNumber <= 0) {
    return { error: 'servings must be a positive integer.' };
  }

  return {
    title,
    description,
    cuisine,
    diet,
    meal_type: mealType,
    prep_time: prepTime,
    cook_time: cookTime,
    servings,
    image,
    ingredients,
    instructions,
    nutrition,
  };
}

async function getOwnedResourceOrError(resourcesCollection, resourceId, ownerId) {
  if (!ObjectId.isValid(resourceId)) {
    securityLog('resource.invalid_id', { resourceId, ownerId });
    return { status: 404, error: 'Resource not found.' };
  }

  const resource = await resourcesCollection.findOne({ _id: new ObjectId(resourceId) });
  if (!resource) {
    return { status: 404, error: 'Resource not found.' };
  }

  if (resource.owner !== ownerId) {
    securityLog('resource.forbidden_access', {
      resourceId,
      ownerId,
      resourceOwnerId: resource.owner,
    });
    return { status: 403, error: 'Forbidden.' };
  }

  return { resource };
}

function buildPatchPayload(existingResource, payload) {
  return {
    title: payload?.title ?? existingResource.title,
    description: payload?.description ?? existingResource.description,
    cuisine: payload?.cuisine ?? existingResource.cuisine,
    diet: payload?.diet ?? existingResource.diet,
    meal_type: payload?.meal_type ?? existingResource.meal_type,
    prep_time: payload?.prep_time ?? existingResource.prep_time,
    cook_time: payload?.cook_time ?? existingResource.cook_time,
    servings: payload?.servings ?? existingResource.servings,
    image: payload?.image ?? existingResource.image,
    ingredients: payload?.ingredients ?? existingResource.ingredients,
    instructions: payload?.instructions ?? existingResource.instructions,
    nutrition: payload?.nutrition ?? existingResource.nutrition,
  };
}

async function updateResourceHandler(req, res, options = { partial: false }) {
  try {
    const db = getDB();
    const resourcesCollection = db.collection('resources');
    const access = await getOwnedResourceOrError(resourcesCollection, req.params.id, req.user.sub);

    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    const payload = options.partial ? buildPatchPayload(access.resource, req.body) : req.body;
    const validation = validateResourcePayload(payload);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const update = {
      title: validation.title,
      description: validation.description,
      cuisine: validation.cuisine,
      diet: validation.diet,
      meal_type: validation.meal_type,
      prep_time: validation.prep_time,
      cook_time: validation.cook_time,
      servings: validation.servings,
      image: validation.image,
      ingredients: validation.ingredients,
      instructions: validation.instructions,
      nutrition: validation.nutrition,
      updatedAt: new Date(),
    };

    await resourcesCollection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
    const updatedResource = { ...access.resource, ...update };
    await publishEvent('updated', updatedResource);
    console.log(`[resource] updated id=${req.params.id} by=${req.user.username}`);
    return res.json({ data: updatedResource, event: 'updated' });
  } catch (error) {
    console.error('[resource] error updating resource:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'resource-service',
    endpoints: ['/health', '/resources'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'resource-service' });
});

app.get('/resources', authenticateToken, async (req, res) => {
  try {
    const query = sanitizeInput(req.query?.q || '');
    const ownerId = req.user?.sub;
    const db = getDB();
    const resourcesCollection = db.collection('resources');

    let filter = { owner: ownerId };
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }

    const resources = await resourcesCollection.find(filter).toArray();
    res.json({ data: resources });
  } catch (error) {
    console.error('[resource] error fetching resources:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/resources/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const resourcesCollection = db.collection('resources');
    const access = await getOwnedResourceOrError(resourcesCollection, req.params.id, req.user.sub);

    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    res.json({ data: access.resource });
  } catch (error) {
    console.error('[resource] error fetching resource:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/resources', authenticateToken, writeLimiter, async (req, res) => {
  try {
    const validation = validateResourcePayload(req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const db = getDB();
    const resourcesCollection = db.collection('resources');

    const resource = {
      title: validation.title,
      description: validation.description,
      cuisine: validation.cuisine,
      diet: validation.diet,
      meal_type: validation.meal_type,
      prep_time: validation.prep_time,
      cook_time: validation.cook_time,
      servings: validation.servings,
      image: validation.image,
      ingredients: validation.ingredients,
      instructions: validation.instructions,
      nutrition: validation.nutrition,
      owner: req.user.sub,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await resourcesCollection.insertOne(resource);
    const createdResource = { _id: result.insertedId, ...resource };
    await publishEvent('created', createdResource);
    console.log(`[resource] created id=${result.insertedId} by=${req.user.username}`);
    res.status(201).json({ data: createdResource, event: 'created' });
  } catch (error) {
    console.error('[resource] error creating resource:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.put('/resources/:id', authenticateToken, writeLimiter, async (req, res) => {
  updateResourceHandler(req, res, { partial: false });
});

app.patch('/resources/:id', authenticateToken, writeLimiter, async (req, res) => {
  updateResourceHandler(req, res, { partial: true });
});

app.delete('/resources/:id', authenticateToken, writeLimiter, async (req, res) => {
  try {
    const db = getDB();
    const resourcesCollection = db.collection('resources');
    const access = await getOwnedResourceOrError(resourcesCollection, req.params.id, req.user.sub);

    if (access.error) {
      return res.status(access.status).json({ error: access.error });
    }

    await resourcesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    await publishEvent('deleted', access.resource);
    console.log(`[resource] deleted id=${req.params.id} by=${req.user.username}`);
    res.json({ data: access.resource, event: 'deleted' });
  } catch (error) {
    console.error('[resource] error deleting resource:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.all('/resources', (req, res) => {
  securityLog('http.method_not_allowed', { method: req.method, path: '/resources', ip: req.ip });
  res.set('Allow', 'GET, POST');
  res.status(405).json({ error: `Method ${req.method} not allowed on /resources.` });
});

app.all('/resources/:id', (req, res) => {
  securityLog('http.method_not_allowed', { method: req.method, path: '/resources/:id', ip: req.ip });
  res.set('Allow', 'GET, PUT, PATCH, DELETE');
  res.status(405).json({ error: `Method ${req.method} not allowed on /resources/:id.` });
});

(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`[resource] service running on port ${PORT}`);
    });

    process.on('SIGINT', async () => {
      console.log('[resource] shutting down...');
      await closeDB();
      process.exit(0);
    });
  } catch (error) {
    console.error('[resource] startup error:', error);
    process.exit(1);
  }
})();
