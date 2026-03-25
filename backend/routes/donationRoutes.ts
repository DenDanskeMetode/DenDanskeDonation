import { Router, Request, Response } from 'express';
import DonationManager from '../services/donationHandler.js';
import { UserManager } from '../services/userHandler.js';
import { getCampaignTitle } from '../dbHandler.js';
import { sendThankYouEmail } from '../services/emailHandler.js';
import { authenticateJWT } from '../middleware/authenticateJWT.js';
import { broadcastDonation } from '../services/sse.js';

const router = Router();

router.post('/donations', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { to_campaign, amount, cpr_number, is_anonymous = false } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }
    if (!to_campaign) {
      return res.status(400).json({ error: 'Campaign ID required' });
    }

    const donation = await DonationManager.donate({
      from_user: req.user!.userId,
      to_campaign,
      amount,
      is_anonymous,
    });

    if (cpr_number) {
      if (!/^\d{6}-\d{4}$/.test(cpr_number)) {
        return res.status(400).json({ error: 'cpr_number must be in the format DDMMYY-XXXX (e.g. 128497-4628)' });
      }
      await UserManager.upsertCpr(req.user!.userId, cpr_number);
    }

    broadcastDonation(Number(to_campaign), {
      id: donation.id,
      amount: donation.amount,
      created_at: donation.created_at,
      is_anonymous,
      sender_username: is_anonymous ? null : req.user!.username,
      sender_firstname: is_anonymous ? null : req.user!.firstname,
    });

    getCampaignTitle(Number(to_campaign))
      .then((title: string | null) =>
        sendThankYouEmail(req.user!.userId, Number(amount), title ?? 'kampagnen')
      )
      .catch((err: unknown) => console.error('Error sending thank-you email:', err));

    res.status(201).json(donation);
  } catch (error: any) {
    if (error.message?.includes('Amount must be') || error.message?.includes('required')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error processing donation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
