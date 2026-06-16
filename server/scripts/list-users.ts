
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';

async function listUsers() {
  const allUsers = await db.query.users.findMany({
    columns: {
      id: true,
      email: true,
      role: true
    }
  });
  console.log(allUsers);
}

listUsers().catch(console.error);
