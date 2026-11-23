import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseGlobal: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseGlobal ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseGlobal) {
  global.mongooseGlobal = cached;
}

export function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI;
  return Boolean(uri && uri.trim().length > 0 && !uri.includes("<username>"));
}

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!isMongoConfigured()) {
    // Graceful fallback: return null so API routes can switch to in-memory mock store
    return null;
  }

  const uri = process.env.MONGODB_URI!;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };
    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err: unknown) {
    cached.promise = null;
    // Log warning and return null for seamless fallback
    console.warn("MongoDB connection failed, falling back to mock store:", err);
    return null;
  }

  return cached.conn;
}
