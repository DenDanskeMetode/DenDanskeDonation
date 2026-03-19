const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createDonation } = require('../dbHandler');

router.post('/create-payment-intent', async (req, res) => {
  const { amount, from_user, to_campain } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'dkk',
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/confirm-donation', async (req, res) => {
  const { from_user, to_campain, amount } = req.body;

  try {
    const donation = await createDonation({ from_user, to_campain, amount });
    res.json({ success: true, donation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;