import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

function PaymentForm({ amount, to_campaign, isRecurring, isAnonymous = false, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
  // 1. Opret payment intent eller subscription
  const res = await fetch(isRecurring ? "/api/payments/create-subscription" : "/api/payments/create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ amount, to_campaign, is_anonymous: isAnonymous }),
  });

  if (!res.ok) throw new Error("Failed to create payment intent");
  const { clientSecret, stripeSubscriptionId } = await res.json();

  // 2. Bekræft betaling med Stripe
  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: elements.getElement(CardElement),
    },
  });

  if (result.error) {
    setMessage(result.error.message);
    onError?.(result.error.message);
  } else {
    if (isRecurring) {
      // 3a. Gem bekræftet abonnement i databasen
      const subRes = await fetch("/api/subscriptions/record", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ stripe_subscription_id: stripeSubscriptionId, to_campaign, amount, is_anonymous: isAnonymous }),
      });
      if (!subRes.ok) throw new Error("Failed to save subscription");
    } else {
      // 3b. Gem donation i databasen - kun ved engangsbetaling
      const donationRes = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ to_campaign, amount, is_anonymous: isAnonymous }),
      });
      if (!donationRes.ok) throw new Error("Failed to save donation");
    }

    setMessage(isRecurring
      ? "Månedlig donation oprettet! Tak 🎉"
      : "Betaling gennemført! Tak for din donation 🎉"
    );
    onSuccess?.();
  }
} catch (error) {
  setMessage(error.message || "En fejl opstod");
  onError?.(error.message);
}
  setLoading(false);
};

  return (
    <form onSubmit={handleSubmit}>
      <div className="card-element-wrapper">
        <CardElement options={{ style: { base: { fontSize: '16px', color: '#1a1a1a', '::placeholder': { color: '#bbb' } } } }} />
      </div>
      <button type="submit" disabled={!stripe || loading}>
        {loading ? "Behandler..." : `Donér ${amount} kr.`}
      </button>
      {message && <p className="payment-error">{message}</p>}
    </form>
  );
}

export default PaymentForm;