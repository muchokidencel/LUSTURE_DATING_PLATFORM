import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000, // Wait up to 30s for a connection (Neon cold start support)
  max: 10, // Limit pool size for serverless compatibility
});

pool.on('connect', (client) => {
  client.on('notice', (msg) => {
    console.log(`[DB-NOTICE] ${msg.message}`);
  });
});

export const db = drizzle(pool, { schema });
