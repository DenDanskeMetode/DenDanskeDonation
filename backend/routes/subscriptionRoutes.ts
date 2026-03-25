import { Router, Request, Response } from 'express';
import { recordSubscription, getUserSubscriptions, getSubscriptionById, cancelSubscription } from '../services/subscriptionService.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { broadcastDonation } from '../services/sse.js';

const router = Router();

router.post('/subscriptions/record', authenticateJWT, async (req: Request, res: Response) => {
  const { stripe_subscription_id, to_campaign, amount, is_anonymous = false } = req.body;
  try {
    const sub = await recordSubscription(req.user!.userId, { stripe_subscription_id, to_campaign, amount, is_anonymous });
    broadcastDonation(Number(to_campaign), {
      id: sub.id,
      amount: sub.amount,
      created_at: sub.created_at,
      is_anonymous,
      sender_username: is_anonymous ? null : req.user!.username,
      sender_firstname: is_anonymous ? null : req.user!.firstname,
    });
    res.status(201).json(sub);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/subscriptions', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const subscriptions = await getUserSubscriptions(req.user!.userId);
    res.json(subscriptions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/subscriptions/:id', authenticateJWT, async (req: Request, res: Response) => {
  const subscriptionId = parseInt(req.params.id as string);
  try {
    const subscription = await getSubscriptionById(subscriptionId, req.user!.userId);
    res.json(subscription);
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/subscriptions/:id', authenticateJWT, async (req: Request, res: Response) => {
  const subscriptionId = parseInt(req.params.id as string);
  try {
    await cancelSubscription(subscriptionId, req.user!.userId);
    res.status(204).send();
  } catch (error: any) {
    if (error.status === 404) return res.status(404).json({ error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;
