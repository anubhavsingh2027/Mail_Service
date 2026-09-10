import { MongoClient } from "mongodb";

let database;

export async function connectMongoDB() {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) throw new Error("MONGO_URL is required");
  const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  database = client.db();
  await database
    .collection("email_jobs")
    .createIndex({ status: 1, scheduledAt: 1 });
  await database
    .collection("website_access")
    .createIndex({ websiteName: 1 }, { unique: true });
  await database
    .collection("users")
    .createIndex({ email: 1 }, { unique: true });
  return database;
}

export function emailJobs() {
  if (!database) throw new Error("MongoDB is not connected");
  return database.collection("email_jobs");
}

export function websiteAccess() {
  if (!database) throw new Error("MongoDB is not connected");
  return database.collection("website_access");
}

export function users() {
  if (!database) throw new Error("MongoDB is not connected");
  return database.collection("users");
}
