import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userParam = params.get('user');
    const error = params.get('error');

    if (error || !token || !userParam) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/', { replace: true });
    } catch {
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [navigate]);

  return null;
}

export default OAuthCallback;
