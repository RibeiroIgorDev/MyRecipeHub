const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { ObjectId } = require('mongodb');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { connectDB, getDB, closeDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_TTL = process.env.JWT_TTL || '15m';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004/events/queue';

app.use(cors());
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
});

function sanitizeInput(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
}

async function publishEvent(type, payload) {
  try {
    await fetch(NOTIFICATION_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
  } catch (error) {
    console.error(`[auth] failed to publish event ${type}:`, error);
  }
}

async function seedUsers() {
  const db = getDB();
  const usersCollection = db.collection('users');
  const defaults = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'demo', password: 'demo123', role: 'user' },
  ];

  for (const user of defaults) {
    const existing = await usersCollection.findOne({ username: user.username });
    if (!existing) {
      await usersCollection.insertOne({
        username: user.username,
        email: `${user.username}@example.com`,
        passwordHash: await bcrypt.hash(user.password, 10),
        role: user.role,
        createdAt: new Date(),
      });
    }
  }
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const db = getDB();
    const revokedTokensCollection = db.collection('revoked_tokens');
    const isRevoked = await revokedTokensCollection.findOne({ token });
    if (isRevoked) {
      return res.status(401).json({ error: 'Token revoked.' });
    }
  } catch (err) {
    console.error('[auth] error checking revoked tokens:', err);
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    req.user = payload;
    next();
  });
}

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    endpoints: ['/health', '/login', '/logout', '/me'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.post('/login', loginLimiter, async (req, res) => {
  const username = sanitizeInput(req.body?.username || '');
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required.' });
  }

  try {
    const db = getDB();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username: username.toLowerCase() });

    if (!user) {
      console.log(`[auth] failed login for username=${username}`);
      await publishEvent('auth.login.failed', {
        username,
        reason: 'invalid_credentials',
        at: new Date().toISOString(),
      });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      console.log(`[auth] failed login for username=${username}`);
      await publishEvent('auth.login.failed', {
        username,
        reason: 'invalid_credentials',
        at: new Date().toISOString(),
      });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_TTL }
    );

    console.log(`[auth] success login username=${user.username}`);
    await publishEvent('auth.login.succeeded', {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      at: new Date().toISOString(),
    });
    res.json({
      message: 'Login successful.',
      token,
      expiresIn: JWT_TTL,
      user: { id: user._id.toString(), username: user.username, role: user.role },
    });
  } catch (error) {
    console.error('[auth] login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/logout', authenticateToken, async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const db = getDB();
      const revokedTokensCollection = db.collection('revoked_tokens');
      const decoded = jwt.decode(token);
      await revokedTokensCollection.insertOne({
        token,
        revokedAt: new Date(),
        expiresAt: new Date(decoded.exp * 1000),
      });
    } catch (error) {
      console.error('[auth] logout error:', error);
    }
  }

  console.log(`[auth] logout user=${req.user.username}`);
  await publishEvent('auth.logout.succeeded', {
    userId: req.user.sub,
    username: req.user.username,
    role: req.user.role,
    at: new Date().toISOString(),
  });
  res.json({ message: 'Logout successful.' });
});

app.get('/me', authenticateToken, async (req, res) => {
  res.json({ user: { id: req.user.sub, username: req.user.username, role: req.user.role } });
});

(async () => {
  try {
    await connectDB();
    await seedUsers();
    app.listen(PORT, () => {
      console.log(`[auth] service running on port ${PORT}`);
      console.log('[auth] seeded demo users: admin/admin123 and demo/demo123');
    });

    process.on('SIGINT', async () => {
      console.log('[auth] shutting down...');
      await closeDB();
      process.exit(0);
    });
  } catch (error) {
    console.error('[auth] startup error:', error);
    process.exit(1);
  }
})();
