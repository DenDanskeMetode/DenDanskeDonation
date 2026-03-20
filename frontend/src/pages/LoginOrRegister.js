import { useState } from 'react';
import './css/LoginOrRegister.css';
import SocialAuthButtons from '../components/SocialAuthButtons';

function LoginOrRegister() {
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState('email'); // 'email' | 'login' | 'register'
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState('');

  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailVerified(false);
    setMode('email');
    setError('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setConfirmPassword('');
    setAge('');
    setGender('');
  };

  const isDisabled =
    isChecking ||
    isSubmitting ||
    (mode === 'email' && !email) ||
    (mode === 'login' && !password) ||
    (mode === 'register' && (!firstName || !lastName || !password || !confirmPassword));

  const handleContinue = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'email') {
      setIsChecking(true);
      try {
        const res = await fetch(`/api/user-exists?email=${encodeURIComponent(email)}`);
        const exists = await res.json();
        if (exists) {
          setEmailVerified(true);
          setMode('login');
        } else {
          setMode('register');
        }
      } catch (err) {
        console.error('Error checking user:', err);
        setError('Noget gik galt. Prøv igen.');
      } finally {
        setIsChecking(false);
      }
    } else if (mode === 'login') {
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Forkert adgangskode. Prøv igen.');
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Login error:', err);
        setError('Noget gik galt. Prøv igen.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Adgangskoderne stemmer ikke overens.');
        return;
      }
      setIsSubmitting(true);
      try {
        const username = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email,
            firstname: firstName,
            surname: lastName,
            password,
            age: age ? parseInt(age) : null,
            gender: gender || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Noget gik galt. Prøv igen.');
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Registration error:', err);
        setError('Noget gik galt. Prøv igen.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="login">
      <img src="/logo.png" alt="Den Danske Donation logo" className="login-logo" />
      <h1 className="login-title" key={mode}>
        {mode === 'login' ? 'Log ind' : mode === 'register' ? 'Registrer' : 'Log ind eller registrer'}
      </h1>

      <form className="login-form" onSubmit={handleContinue}>
        <div className="email-input-wrapper">
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
          />
          {isChecking && (
            <span className="email-status-icon">
              <span className="email-spinner" />
            </span>
          )}
          {!isChecking && emailVerified && (
            <span className="email-status-icon email-checkmark">✓</span>
          )}
        </div>

        {mode === 'login' && (
          <input
            className="login-input login-input--slide-in"
            type="password"
            placeholder="Adgangskode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {mode === 'register' && (
          <>
            <input
              className="login-input login-input--slide-in"
              type="text"
              placeholder="Fornavn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="login-input login-input--slide-in"
              style={{ animationDelay: '40ms' }}
              type="text"
              placeholder="Efternavn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <input
              className="login-input login-input--slide-in"
              style={{ animationDelay: '80ms' }}
              type="password"
              placeholder="Adgangskode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className="login-input login-input--slide-in"
              style={{ animationDelay: '120ms' }}
              type="password"
              placeholder="Gentag adgangskode"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className="login-input-row">
              <input
                className="login-input login-input--slide-in"
                style={{ animationDelay: '160ms' }}
                type="number"
                placeholder="Alder"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <select
                className={`login-input login-input--slide-in${gender === '' ? ' login-select--placeholder' : ''}`}
                style={{ animationDelay: '160ms' }}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="" disabled>Køn</option>
                <option value="mand">Mand</option>
                <option value="kvinde">Kvinde</option>
                <option value="andet">Andet</option>
              </select>
            </div>
          </>
        )}

        {error && <p className="login-error">{error}</p>}

        <button className="login-btn-primary" type="submit" disabled={isDisabled}>
          {isSubmitting ? <span className="email-spinner login-btn-spinner" /> : mode === 'login' ? 'Log ind' : mode === 'register' ? 'Opret ny bruger' : 'Fortsæt'}
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
