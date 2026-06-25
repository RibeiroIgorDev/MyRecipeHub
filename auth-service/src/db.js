const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_DB = process.env.MONGO_DB || 'myrecipehub';

let client = null;
let db = null;

async function connectDB() {
  try {
    client = new MongoClient(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(MONGO_DB);

    // Ensure collections exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    if (!collectionNames.includes('users')) {
      await db.createCollection('users');
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
    }

    if (!collectionNames.includes('revoked_tokens')) {
      await db.createCollection('revoked_tokens');
      await db.collection('revoked_tokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }

    console.log('[auth] connected to MongoDB');
    return db;
  } catch (error) {
    console.error('[auth] failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log('[auth] disconnected from MongoDB');
  }
}

module.exports = { connectDB, getDB, closeDB };
