// MongoDB connection with Mongoose — cached for serverless / Edge re-use

import mongoose, { Connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local",
  );
}

/**
 * Global cache so we don't spin up new connections on every
 * serverless function invocation in development or production.
 */
interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

// Augment the global type so TypeScript recognises the cache
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Returns a Mongoose connection. Re-uses the cached connection when available
 * and creates a new one otherwise (safe for both serverless and long-lived
 * server processes).
 */
async function connectDB(): Promise<Connection> {
  // Already connected — return immediately
  if (cached.conn) {
    return cached.conn;
  }

  // Connection is being established — await the existing promise
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((m) => {
        console.log("[MongoDB] Connected successfully");
        return m.connection;
      })
      .catch((err) => {
        // Reset the promise so we can retry on next invocation
        cached.promise = null;
        console.error("[MongoDB] Connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
