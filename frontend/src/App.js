import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "./components/PaymentForm";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  const [amount, setAmount] = useState(100);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Den Danske Donation</h1>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Beløb i kr."
      />
      <Elements stripe={stripePromise}>
        <PaymentForm amount={amount} from_user={1} to_campain={1} />
      </Elements>
    </div>
  );
}

export default App;