import { useState } from 'react';
import './Register.css';

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
        <button className="register-btn-social">
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Fortsæt med Google
        </button>

        <button className="register-btn-social">
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.024 10.125 11.927v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.885v2.27h3.328l-.532 3.49h-2.796v8.437C19.612 23.097 24 18.1 24 12.073z"/>
          </svg>
          Fortsæt med Facebook
        </button>
      </div>
    </div>
  );
}

export default Register;
