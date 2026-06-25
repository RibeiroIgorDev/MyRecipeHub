const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { WebSocketServer } = require('ws');

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

const clients = new Set();

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

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'notification-service',
    endpoints: ['/health', '/events'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

app.post('/events', (req, res) => {
  const event = req.body;
  if (!event?.type) {
    return res.status(400).json({ error: 'type is required.' });
  }

  console.log(`[notification] event received: ${event.type}`);
  broadcast(event);
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`[notification] service running on port ${PORT}`);
});
