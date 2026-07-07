const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const { WebSocketServer } = require('ws');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3004;
const MAX_QUEUE_SIZE = Number(process.env.EVENT_QUEUE_MAX_SIZE || 1000);
const SERVICE_NAME = 'notification-service';

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

const clients = new Set();
const eventQueue = [];
let processingQueue = false;

const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  clients.add(socket);
  console.log('[notification] client connected');

  socket.on('message', (message) => {
    const text = message.toString();
    console.log(`[notification] message received: ${text}`);
  });

  socket.on('close', () => {
    clients.delete(socket);
    console.log('[notification] client disconnected');
  });
});

function broadcast(event) {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

function sanitizeInput(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
}

function validateEventPayload(payload) {
  const type = sanitizeInput(payload?.type || '');
  if (!type) {
    return { error: 'type is required.' };
  }

  if (type.length < 3) {
    return { error: 'type must contain at least 3 characters.' };
  }

  return {
    type,
    payload: payload?.payload ?? payload?.resource ?? null,
  };
}

function enqueueEvent(event) {
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    eventQueue.shift();
  }

  eventQueue.push({
    ...event,
    queuedAt: new Date().toISOString(),
  });

  processQueue();
}

function processQueue() {
  if (processingQueue) return;
  processingQueue = true;

  setImmediate(() => {
    try {
      while (eventQueue.length > 0) {
        const event = eventQueue.shift();
        broadcast(event);
      }
    } finally {
      processingQueue = false;
      if (eventQueue.length > 0) {
        processQueue();
      }
    }
  });
}

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'notification-service',
    endpoints: ['/health', '/events', '/events/queue'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

app.get('/events/queue', (req, res) => {
  res.json({
    status: 'ok',
    queueSize: eventQueue.length,
    maxQueueSize: MAX_QUEUE_SIZE,
  });
});

app.post('/events/queue', (req, res) => {
  const validation = validateEventPayload(req.body);
  if (validation.error) {
    securityLog('events.invalid_payload', { path: '/events/queue', ip: req.ip });
    return res.status(400).json({ error: validation.error });
  }

  console.log(`[notification] event queued: ${validation.type}`);
  enqueueEvent(validation);
  res.status(202).json({ status: 'queued' });
});

app.post('/events', (req, res) => {
  const validation = validateEventPayload(req.body);
  if (validation.error) {
    securityLog('events.invalid_payload', { path: '/events', ip: req.ip });
    return res.status(400).json({ error: validation.error });
  }

  console.log(`[notification] event received: ${validation.type}`);
  enqueueEvent(validation);
  res.status(202).json({ status: 'queued' });
});

app.all('/events', (req, res) => {
  securityLog('http.method_not_allowed', { method: req.method, path: '/events', ip: req.ip });
  res.set('Allow', 'POST');
  res.status(405).json({ error: `Method ${req.method} not allowed on /events.` });
});

app.all('/events/queue', (req, res) => {
  securityLog('http.method_not_allowed', { method: req.method, path: '/events/queue', ip: req.ip });
  res.set('Allow', 'GET, POST');
  res.status(405).json({ error: `Method ${req.method} not allowed on /events/queue.` });
});

server.listen(PORT, () => {
  console.log(`[notification] service running on port ${PORT}`);
});
