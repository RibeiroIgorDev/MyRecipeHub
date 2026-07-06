const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { WebSocketServer } = require('ws');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3004;
const MAX_QUEUE_SIZE = Number(process.env.EVENT_QUEUE_MAX_SIZE || 1000);

app.use(cors());
app.use(express.json());

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
  const event = req.body;
  if (!event?.type) {
    return res.status(400).json({ error: 'type is required.' });
  }

  console.log(`[notification] event queued: ${event.type}`);
  enqueueEvent(event);
  res.status(202).json({ status: 'queued' });
});

app.post('/events', (req, res) => {
  const event = req.body;
  if (!event?.type) {
    return res.status(400).json({ error: 'type is required.' });
  }

  console.log(`[notification] event received: ${event.type}`);
  enqueueEvent(event);
  res.status(202).json({ status: 'queued' });
});

server.listen(PORT, () => {
  console.log(`[notification] service running on port ${PORT}`);
});
