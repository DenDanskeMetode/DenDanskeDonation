import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

function PaymentForm({ amount, from_user, to_campain }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Hent clientSecret fra backend
    const res = await fetch("http://localhost:5000/api/payments/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, from_user, to_campain }),
    });

    const { clientSecret } = await res.json();

    // Bekræft betaling med Stripe
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      // Gem donation i databasen
      await fetch("http://localhost:5000/api/payments/confirm-donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_user, to_campain, amount }),
      });

      setMessage("Betaling gennemført! Tak for din donation 🎉");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? "Behandler..." : `Donér ${amount} kr.`}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default PaymentForm;