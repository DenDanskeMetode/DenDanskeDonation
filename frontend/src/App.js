import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import './App.css';
import Home from './pages/Home';
import Campaigns from './pages/Campaigns';
import Login from './pages/Login';
import LoginOrRegister from './pages/LoginOrRegister';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

function App() {
  return (
    <Elements stripe={stripePromise}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </Elements>
  );
}

export default App;
