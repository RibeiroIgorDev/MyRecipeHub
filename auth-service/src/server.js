const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_TTL = process.env.JWT_TTL || '15m';

app.use(cors());
app.use(express.json());

const revokedTokens = new Set();
const users = [];

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

async function seedUsers() {
  const defaults = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'demo', password: 'demo123', role: 'user' },
  ];

  for (const user of defaults) {
    users.push({
      id: user.username,
      username: user.username,
      passwordHash: await bcrypt.hash(user.password, 10),
      role: user.role,
    });
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (revokedTokens.has(token)) {
    return res.status(401).json({ error: 'Token revoked.' });
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

  const user = users.find((item) => item.username === username.toLowerCase());

  if (!user) {
    console.log(`[auth] failed login for username=${username}`);
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    console.log(`[auth] failed login for username=${username}`);
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_TTL }
  );

  console.log(`[auth] success login username=${user.username}`);
  res.json({
    message: 'Login successful.',
    token,
    expiresIn: JWT_TTL,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

app.post('/logout', authenticateToken, (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    revokedTokens.add(token);
  }

  console.log(`[auth] logout user=${req.user.username}`);
  res.json({ message: 'Logout successful.' });
});

app.get('/me', authenticateToken, (req, res) => {
  res.json({ user: { id: req.user.sub, username: req.user.username, role: req.user.role } });
});

seedUsers().then(() => {
  app.listen(PORT, () => {
    console.log(`[auth] service running on port ${PORT}`);
    console.log('[auth] seeded demo users: admin/admin123 and demo/demo123');
  });
}).catch((error) => {
  console.error('[auth] failed to seed users', error);
  process.exit(1);
});
