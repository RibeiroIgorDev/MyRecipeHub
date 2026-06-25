const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const http = require('http');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3003;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004/events';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const resources = [];
let nextId = 1;

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

function validateResourcePayload(payload) {
  const title = sanitizeInput(payload?.title || '');
  const description = sanitizeInput(payload?.description || '');
  const theme = sanitizeInput(payload?.theme || '');

  if (!title || !description || !theme) {
    return { error: 'title, description and theme are required.' };
  }

  return { title, description, theme };
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

app.get('/resources', authenticateToken, (req, res) => {
  const query = sanitizeInput(req.query?.q || '');
  const theme = sanitizeInput(req.query?.theme || '');
  const ownerId = req.user?.sub;

  const filtered = resources.filter((resource) => {
    const belongsToUser = resource.ownerId === ownerId;
    const matchesQuery = !query || resource.title.toLowerCase().includes(query.toLowerCase()) || resource.description.toLowerCase().includes(query.toLowerCase());
    const matchesTheme = !theme || resource.theme.toLowerCase() === theme.toLowerCase();
    return belongsToUser && matchesQuery && matchesTheme;
  });

  res.json({ data: filtered });
});

app.post('/resources', authenticateToken, writeLimiter, async (req, res) => {
  const validation = validateResourcePayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const resource = {
    id: nextId++,
    title: validation.title,
    description: validation.description,
    theme: validation.theme,
    ownerId: req.user.sub,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  resources.push(resource);
  await publishEvent('created', resource);
  console.log(`[resource] created id=${resource.id} by=${req.user.username}`);
  res.status(201).json({ data: resource, event: 'created' });
});

app.put('/resources/:id', authenticateToken, writeLimiter, async (req, res) => {
  const resource = resources.find((item) => item.id === Number(req.params.id));
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found.' });
  }

  if (resource.ownerId !== req.user.sub) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  const validation = validateResourcePayload(req.body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  resource.title = validation.title;
  resource.description = validation.description;
  resource.theme = validation.theme;
  resource.updatedAt = new Date().toISOString();

  await publishEvent('updated', resource);
  console.log(`[resource] updated id=${resource.id} by=${req.user.username}`);
  res.json({ data: resource, event: 'updated' });
});

app.delete('/resources/:id', authenticateToken, writeLimiter, async (req, res) => {
  const index = resources.findIndex((item) => item.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Resource not found.' });
  }

  const resource = resources[index];
  if (resource.ownerId !== req.user.sub) {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  resources.splice(index, 1);
  await publishEvent('deleted', resource);
  console.log(`[resource] deleted id=${resource.id} by=${req.user.username}`);
  res.json({ data: resource, event: 'deleted' });
});

server.listen(PORT, () => {
  console.log(`[resource] service running on port ${PORT}`);
});
