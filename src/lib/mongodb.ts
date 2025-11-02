import { MongoClient } from "mongodb";

// Support à la fois MONGO_URL (Railway) et MONGODB_URI (Atlas/autre)
const uri = (process.env.MONGO_URL || process.env.MONGODB_URI) as string;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

// Vérifier qu'une URI MongoDB est configurée
if (!uri) {
  throw new Error("MongoDB URI is not configured. Please add MONGO_URL or MONGODB_URI to your environment variables");
}

// Configuration MongoDB pour tous les environnements
if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri, options);
    (global as any)._mongoClientPromise = client.connect();
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise; 