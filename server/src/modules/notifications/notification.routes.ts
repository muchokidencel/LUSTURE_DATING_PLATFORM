import { Router } from 'express';
import { db } from '../../db/index.js';
import { notifications } from '../../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authenticate, AuthRequest } from '../../middleware/auth.js';

const router = Router();

// Get all notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const list = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });
    
    res.json({ 
      status: 'success', 
      data: list 
    });
  } catch (error: any) {
    console.error(`[NOTIFICATION:GET:ERROR] userId=${userId}:`, error.message);
    res.status(500).json({ message: 'Error retrieving notifications' });
  }
});

// Mark all notifications for the user as read
router.put('/read-all', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
      
    res.json({ status: 'success' });
  } catch (error: any) {
    console.error(`[NOTIFICATION:READALL:ERROR] userId=${userId}:`, error.message);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
});

// Mark a single notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const notificationId = parseInt(req.params.id);
  
  if (isNaN(notificationId)) {
    return res.status(400).json({ message: 'Invalid notification ID' });
  }
  
  try {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
      
    res.json({ status: 'success' });
  } catch (error: any) {
    console.error(`[NOTIFICATION:READ:ERROR] id=${notificationId}:`, error.message);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

export default router;
