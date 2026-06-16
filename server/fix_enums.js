import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

const fixEnums = async () => {
  console.log('Updating Enums in Database...');
  try {
    // Add missing values to existing enums
    await db.execute(sql`ALTER TYPE intent ADD VALUE IF NOT EXISTS 'unspecified'`);
    await db.execute(sql`ALTER TYPE intent ADD VALUE IF NOT EXISTS 'dating'`);
    await db.execute(sql`ALTER TYPE intent ADD VALUE IF NOT EXISTS 'one_night'`);
    
    await db.execute(sql`ALTER TYPE gender ADD VALUE IF NOT EXISTS 'non_binary'`);
    
    console.log('Enums updated successfully.');
  } catch (error) {
    console.error('Failed to update enums:', error);
  } finally {
    process.exit();
  }
};

fixEnums();
