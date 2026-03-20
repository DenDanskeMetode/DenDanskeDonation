import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import './App.css';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import CampaignDetail from './pages/CampaignDetail';
import Profile from './pages/Profile';
import CampaignSettings from './pages/CampaignSettings';
import DonationDetail from './pages/DonationDetail';

const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

function App() {
  return (
    <Elements stripe={stripePromise}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/campaigns/:id/edit" element={<CampaignSettings />} />
          <Route path="/donations/:id" element={<DonationDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </Elements>
  );
}

export default App;
