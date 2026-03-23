import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

function PaymentForm({ amount, to_campaign, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");

    try {
      // 1. Opret payment intent
      const res = await fetch("http://localhost:5000/api/payments/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amount, to_campaign }),
      });

      if (!res.ok) throw new Error("Failed to create payment intent");
      const { clientSecret } = await res.json();

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
        // 3. Gem donation i databasen
        const donationRes = await fetch("http://localhost:5000/api/donations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ to_campaign, amount }),
        });

        if (!donationRes.ok) throw new Error("Failed to save donation");
        const donationData = await donationRes.json();

        setMessage("Betaling gennemført! Tak for din donation 🎉");
        onSuccess?.(donationData);
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