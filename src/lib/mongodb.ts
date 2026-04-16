import 'server-only';

import { MongoClient, Db } from 'mongodb';

function getEnvironment(): string {
  const env = process.env.APP_ENV || process.env.NODE_ENV || 'local';
  if (env === 'production') {
    return 'prod';
  }
  if (env === 'development') {
    return 'dev';
  }
  return env;
}

/** Same connection as skyforge; `getDb()` selects the `watchdb` database. */
function getMongoUri(): string {
  const env = getEnvironment();

  const envSpecificUri = process.env[`SKYFORGE_DB_MONGODB_URI_${env.toUpperCase()}`];
  if (envSpecificUri) {
    return envSpecificUri;
  }

  const uri = process.env.SKYFORGE_DB_MONGODB_URI;
  if (uri) {
    return uri;
  }

  const legacyEnvUri = process.env[`MONGODB_URI_${env.toUpperCase()}`];
  if (legacyEnvUri) {
    return legacyEnvUri;
  }

  const legacyUri = process.env.MONGODB_URI;
  if (legacyUri) {
    return legacyUri;
  }

  throw new Error(
    `add your MongoDB URI to your environment variables`,
  );
}

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _tickrMongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  const uri = getMongoUri();

  if (process.env.NODE_ENV === 'development') {
    if (!global._tickrMongoClientPromise) {
      client = new MongoClient(uri);
      global._tickrMongoClientPromise = client.connect();
    }
    clientPromise = global._tickrMongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db('timely');
}
