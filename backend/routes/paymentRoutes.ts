import { Router, Request, Response } from 'express';
import { createPaymentIntent, createStripeSubscription } from '../services/stripeService.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';

const router = Router();

router.post('/payments/create-payment-intent', authenticateJWT, async (req: Request, res: Response) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }
  try {
    const clientSecret = await createPaymentIntent(amount);
    res.json({ clientSecret });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/payments/create-subscription', authenticateJWT, async (req: Request, res: Response) => {
  const { to_campaign, amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }
  if (!to_campaign) {
    return res.status(400).json({ error: 'Campaign ID required' });
  }
  try {
    const result = await createStripeSubscription(amount, to_campaign, req.user!.userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
