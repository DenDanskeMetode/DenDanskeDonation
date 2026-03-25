import { Router, Request, Response } from 'express';
import { getUserWithCpr, getAllUsersWithCpr } from '../dbHandler.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/users', authenticateJWT, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await getAllUsersWithCpr();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users/:userId', authenticateJWT, requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);
    const user = await getUserWithCpr(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user (admin):', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
