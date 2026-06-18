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
  connectionTimeoutMillis: 60000, // Wait up to 60s for a connection (Neon cold start support)
  idleTimeoutMillis: 30000,       // Close idle connections after 30s
  max: 5,                         // Smaller pool for serverless/Neon compatibility
});

pool.on('connect', (client) => {
  client.on('notice', (msg) => {
    console.log(`[DB-NOTICE] ${msg.message}`);
  });
});

export const db = drizzle(pool, { schema });
