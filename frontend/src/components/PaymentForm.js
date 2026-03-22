import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

function PaymentForm({ amount, from_user, to_campaign, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
      // Create payment intent from backend
      const res = await fetch("http://localhost:5000/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount, from_user, to_campaign }),
      });

      if (!res.ok) throw new Error("Failed to create payment intent");
      const { clientSecret } = await res.json();

      // Confirm card payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setMessage(result.error.message);
        onError?.(result.error.message);
      } else {
        // Save donation to database
        const confirmRes = await fetch("http://localhost:5000/api/payments/confirm-donation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ from_user, to_campaign, amount }),
        });

        if (!confirmRes.ok) throw new Error("Failed to save donation");

        const confirmData = await confirmRes.json();
        setMessage("Betaling gennemført! Tak for din donation 🎉");
        onSuccess?.(confirmData);
      }
    } catch (error) {
      setMessage(error.message || "En fejl opstod");
      onError?.(error.message);
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