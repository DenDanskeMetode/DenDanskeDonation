import pool from '../db.js';
import { stripe } from './stripeService.js';

export interface SubscriptionRecord {
  id: number;
  from_user: number;
  to_campaign: number;
  amount: number;
  stripe_subscription_id: string;
  is_anonymous: boolean;
  created_at: string;
  sender_username?: string | null;
  sender_firstname?: string | null;
}

export async function recordSubscription(
  userId: number,
  data: { stripe_subscription_id: string; to_campaign: number; amount: number; is_anonymous: boolean }
): Promise<SubscriptionRecord> {
  const { stripe_subscription_id, to_campaign, amount, is_anonymous } = data;
  const result = await pool.query(
    'INSERT INTO subscriptions (from_user, to_campaign, amount, stripe_subscription_id, is_anonymous) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, to_campaign, amount, stripe_subscription_id, is_anonymous]
  );
  return result.rows[0];
}

export async function getUserSubscriptions(userId: number) {
  const result = await pool.query(`
    SELECT s.id, s.amount, s.created_at, c.title AS campaign_title, c.id AS campaign_id,
           ARRAY_AGG(ci.image_id ORDER BY ci.added_at) FILTER (WHERE ci.image_id IS NOT NULL) AS image_ids
    FROM subscriptions s
    JOIN campaigns c ON s.to_campaign = c.id
    LEFT JOIN campaign_images ci ON c.id = ci.campaign_id
    WHERE s.from_user = $1 AND s.cancelled_at IS NULL
    GROUP BY s.id, s.amount, s.created_at, c.title, c.id
    ORDER BY s.created_at DESC
  `, [userId]);
  return result.rows;
}

export async function getSubscriptionById(subscriptionId: number, userId: number) {
  const result = await pool.query(`
    SELECT s.id, s.amount, s.created_at, s.stripe_subscription_id,
           c.title AS campaign_title, c.id AS campaign_id,
           ARRAY_AGG(ci.image_id ORDER BY ci.added_at) FILTER (WHERE ci.image_id IS NOT NULL) AS image_ids
    FROM subscriptions s
    JOIN campaigns c ON s.to_campaign = c.id
    LEFT JOIN campaign_images ci ON c.id = ci.campaign_id
    WHERE s.id = $1 AND s.from_user = $2 AND s.cancelled_at IS NULL
    GROUP BY s.id, s.amount, s.created_at, s.stripe_subscription_id, c.title, c.id
  `, [subscriptionId, userId]);

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Subscription not found'), { status: 404 });
  }

  const sub = result.rows[0];
  const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
  const invoices = await stripe.invoices.list({
    subscription: sub.stripe_subscription_id,
    status: 'paid',
    limit: 100,
  });

  const paymentCount = invoices.data.length;

  return {
    ...sub,
    next_payment_date: new Date(stripeSub.current_period_end * 1000).toISOString(),
    payment_count: paymentCount,
    total_paid: paymentCount * Number(sub.amount),
  };
}

export async function cancelSubscription(subscriptionId: number, userId: number): Promise<void> {
  const result = await pool.query(
    'SELECT stripe_subscription_id FROM subscriptions WHERE id = $1 AND from_user = $2',
    [subscriptionId, userId]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Subscription not found'), { status: 404 });
  }

  const { stripe_subscription_id } = result.rows[0];
  await stripe.subscriptions.cancel(stripe_subscription_id);
  await pool.query('UPDATE subscriptions SET cancelled_at = NOW() WHERE id = $1', [subscriptionId]);
}
