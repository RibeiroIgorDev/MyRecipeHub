const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const http = require('http');
const path = require('path');
const { ObjectId } = require('mongodb');
const { connectDB, getDB, closeDB } = require('./db');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3003;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004/events';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json());

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

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
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
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') return parsed;
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

  if (!title || !description || !cuisine || !diet || !mealType || !prepTime || !cookTime || !servings || !image || ingredients.length === 0 || instructions.length === 0) {
    return { error: 'All fields are required except nutrition.' };
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
    const resource = await resourcesCollection.findOne({ _id: new ObjectId(req.params.id) });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    if (resource.owner !== req.user.sub) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    res.json({ data: resource });
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
  try {
    const db = getDB();
    const resourcesCollection = db.collection('resources');
    const resource = await resourcesCollection.findOne({ _id: new ObjectId(req.params.id) });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    if (resource.owner !== req.user.sub) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const validation = validateResourcePayload(req.body);
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
    const updatedResource = { ...resource, ...update };
    await publishEvent('updated', updatedResource);
    console.log(`[resource] updated id=${req.params.id} by=${req.user.username}`);
    res.json({ data: updatedResource, event: 'updated' });
  } catch (error) {
    console.error('[resource] error updating resource:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.delete('/resources/:id', authenticateToken, writeLimiter, async (req, res) => {
  try {
    const db = getDB();
    const resourcesCollection = db.collection('resources');
    const resource = await resourcesCollection.findOne({ _id: new ObjectId(req.params.id) });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }

    if (resource.owner !== req.user.sub) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    await resourcesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    await publishEvent('deleted', resource);
    console.log(`[resource] deleted id=${req.params.id} by=${req.user.username}`);
    res.json({ data: resource, event: 'deleted' });
  } catch (error) {
    console.error('[resource] error deleting resource:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
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
