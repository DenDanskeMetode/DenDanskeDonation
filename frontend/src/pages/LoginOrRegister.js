import { useState } from 'react';
import './css/LoginOrRegister.css';
import SocialAuthButtons from '../components/SocialAuthButtons';

function LoginOrRegister() {
  const [email, setEmail] = useState('');

  const handleContinue = (e) => {
    e.preventDefault();
    // TODO: handle email submit
  };

  return (
    <div className="login">
      <img src="/logo192.png" alt="Den Danske Donation logo" className="login-logo" />
      <h1 className="login-title">Log ind eller registrer</h1>

      <form className="login-form" onSubmit={handleContinue}>
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="login-btn-primary" type="submit">
          Fortsæt
        </button>
      </form>

      <div className="login-divider">
        <span>eller</span>
      </div>

      <div className="login-social">
        <SocialAuthButtons btnClassName="login-btn-social" />
      </div>
    </div>
  );
}

export default LoginOrRegister;
