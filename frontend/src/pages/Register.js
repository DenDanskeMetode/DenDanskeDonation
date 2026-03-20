import { useState } from 'react';
import './css/Register.css';
import SocialAuthButtons from '../components/SocialAuthButtons';

function Register() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const handleContinue = (e) => {
    e.preventDefault();
    // TODO: handle register submit
  };

  return (
    <div className="register">
      <img src="/logo192.png" alt="Den Danske Donation logo" className="register-logo" />
      <h1 className="register-title">Registrer ny bruger</h1>

      <form className="register-form" onSubmit={handleContinue}>
        <input
          className="register-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="register-input"
          type="text"
          placeholder="Fornavn"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className="register-input"
          type="text"
          placeholder="Efternavn"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          className="register-input"
          type="password"
          placeholder="Kodeord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="register-input"
          type="password"
          placeholder="Gentag kodeord"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <div className="register-row">
          <input
            className="register-input"
            type="number"
            placeholder="Alder"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <select
            className="register-input register-select"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="" disabled>Køn</option>
            <option value="mand">Mand</option>
            <option value="kvinde">Kvinde</option>
            <option value="andet">Andet</option>
          </select>
        </div>
        <button className="register-btn-primary" type="submit">
          Fortsæt
        </button>
      </form>

      <div className="register-divider">
        <span>eller</span>
      </div>

      <div className="register-social">
        <SocialAuthButtons btnClassName="register-btn-social" />
      </div>
    </div>
  );
}

export default Register;
