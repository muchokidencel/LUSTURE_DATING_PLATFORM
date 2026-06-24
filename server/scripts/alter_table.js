import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function run() {
  console.log("Altering profiles table to add location_updated_at...");
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await db.execute(sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;`);
      console.log("Column added successfully!");
      process.exit(0);
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err.message || err);
      if (attempt === 5) {
        process.exit(1);
      }
      console.log("Retrying in 5 seconds...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}
run();
