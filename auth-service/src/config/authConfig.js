module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtTtl: process.env.JWT_TTL || '15m',
};
