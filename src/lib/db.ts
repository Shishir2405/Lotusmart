

import mongoose, { Connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;


interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}


declare global {
  
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}


async function connectDB(): Promise<Connection> {
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
  }

  
  if (cached.conn) {
    return cached.conn;
  }

  
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((m) => {
        console.log("[MongoDB] Connected successfully");
        return m.connection;
      })
      .catch((err) => {
        
        cached.promise = null;
        console.error("[MongoDB] Connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
