import Stripe from 'stripe';

export const stripe: Stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any })
  : null as any;

export async function createPaymentIntent(amount: number): Promise<string> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: 'dkk',
  });
  return paymentIntent.client_secret!;
}

export async function createStripeSubscription(
  amount: number,
  toCampaign: number,
  userId: number
): Promise<{ clientSecret: string; stripeSubscriptionId: string }> {
  const customer = await stripe.customers.create({
    metadata: { userId: String(userId) },
  });

  const price = await stripe.prices.create({
    unit_amount: amount * 100,
    currency: 'dkk',
    recurring: { interval: 'month' },
    product_data: { name: `Månedlig donation til kampagne ${toCampaign}` },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    payment_behavior: 'default_incomplete',
  });

  const invoiceId = typeof subscription.latest_invoice === 'string'
    ? subscription.latest_invoice
    : subscription.latest_invoice?.id;

  if (!invoiceId) throw new Error('No invoice on subscription');

  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ['payment_intent'],
  });

  const pi = (invoice as any).payment_intent;
  const paymentIntentId = typeof pi === 'string' ? pi : pi?.id;

  if (!paymentIntentId) throw new Error('No payment intent on invoice');

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent.client_secret) throw new Error('No client secret on payment intent');

  return { clientSecret: paymentIntent.client_secret, stripeSubscriptionId: subscription.id };
}
