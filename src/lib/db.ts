import "server-only";

import { MongoClient, type Db } from "mongodb";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required to connect to MongoDB.");
  }

  if (
    process.env.NODE_ENV === "production" &&
    /mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/])/i.test(uri)
  ) {
    throw new Error("A localhost MongoDB URI cannot be used in production.");
  }

  if (!globalThis.mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
    globalThis.mongoClientPromise = client.connect();
  }

  return globalThis.mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClientPromise();
  return client.db(process.env.MONGODB_DB || "formstudio");
}
