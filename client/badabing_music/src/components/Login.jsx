import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

export const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/home');
    } catch (err) {
      setError(err.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/home');
    } catch (err) {
      setError(err.error || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed');
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    },
    backgroundDecoration: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.1)',
      top: '-100px',
      left: '-100px',
      pointerEvents: 'none'
    },
    backgroundDecoration2: {
      position: 'absolute',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.05)',
      bottom: '-50px',
      right: '-50px',
      pointerEvents: 'none'
    },
    card: {
      width: '100%',
      maxWidth: '420px',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      padding: '50px 40px',
      backdropFilter: 'blur(10px)',
      position: 'relative',
      zIndex: 10,
      animation: 'slideUp 0.6s ease-out'
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    subtitle: {
      color: '#999',
      fontSize: '14px',
      fontWeight: '500'
    },
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#333',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e0e0e0',
      borderRadius: '10px',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      backgroundColor: '#f9f9f9',
      fontFamily: 'inherit',
      outline: 'none',
      boxSizing: 'border-box'
    },
    inputFocused: {
      borderColor: '#667eea',
      backgroundColor: '#fff',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    },
    button: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginTop: '10px',
      letterSpacing: '0.5px'
    },
    buttonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '30px 0',
      gap: '15px'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: '#e0e0e0'
    },
    dividerText: {
      color: '#999',
      fontSize: '13px',
      fontWeight: '500'
    },
    googleContainer: {
      display: 'flex',
      justifyContent: 'center'
    },
    footer: {
      textAlign: 'center',
      marginTop: '25px',
      fontSize: '14px',
      color: '#666'
    },
    link: {
      color: '#667eea',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'color 0.3s ease',
      cursor: 'pointer'
    },
    alert: {
      padding: '12px 16px',
      background: '#fee',
      border: '1px solid #fcc',
      borderRadius: '10px',
      color: '#c33',
      marginBottom: '20px',
      fontSize: '13px',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        input:hover {
          border-color: #667eea !important;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        a:hover {
          color: #764ba2 !important;
        }
      `}</style>
      
      <div style={styles.backgroundDecoration}></div>
      <div style={styles.backgroundDecoration2}></div>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.title}>
            <span>🎵</span>
            <span>Badabing Music</span>
          </div>
          <p style={styles.subtitle}>Welcome back! Login to continue</p>
        </div>

        {error && (
          <div style={styles.alert}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>📧 Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.input,
                ...(focusedField === 'email' ? styles.inputFocused : {})
              }}
              placeholder="your@email.com"
              autoComplete="off"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>🔐 Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...styles.input,
                ...(focusedField === 'password' ? styles.inputFocused : {})
              }}
              placeholder="••••••••"
              autoComplete="off"
              required
            />
          </div>

          <button 
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? '⏳ Logging in...' : '✨ Login'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>atau</span>
          <div style={styles.dividerLine}></div>
        </div>

        <div style={styles.googleContainer}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
          />
        </div>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <a href="/register" style={styles.link}>Create one</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
