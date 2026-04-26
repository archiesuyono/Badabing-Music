import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const GoogleLoginButton = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for Google script to load
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      return;
    }

    // Initialize Google Sign-In
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      ux_mode: 'popup',
      context: 'signin'
    });

    // Render Google Sign-In button
    window.google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      console.log('🔄 Google login response received');
      await loginWithGoogle(response.credential);
      console.log('✅ Google login successful');
      navigate('/');
    } catch (error) {
      console.error('❌ Google login failed:', error);
      alert('Google login failed: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div id="google-signin-button" style={{ marginTop: '1.5rem' }}></div>
  );
};

export default GoogleLoginButton;
