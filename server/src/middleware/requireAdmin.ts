import { Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { AuthRequest } from './auth.js';

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    console.log('[ADMIN:AUTH:DENIED] No user in request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.user.id;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        role: true,
      },
    });

    console.log(`[ADMIN:AUTH:CHECK] userId: ${userId}, role: ${user?.role}`);

    if (user?.role !== 'admin') {
      console.log(`[ADMIN:AUTH:DENIED] userId: ${userId} attempted admin access`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error(`[ADMIN:AUTH:ERROR] userId: ${userId}`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
