import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playlistAPI } from '../api/endpoints';

export const CreatePlaylist = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Playlist name is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await playlistAPI.create(formData.name, formData.description);
      window.dispatchEvent(new Event('playlistUpdated'));
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create playlist');
      console.error('Create playlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      backgroundColor: '#121212',
      minHeight: '100vh',
      color: '#fff',
      paddingTop: '0',
      paddingBottom: '80px'
    },
    navbar: {
      backgroundColor: '#282828',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    },
    navBrand: {
      fontSize: '20px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'opacity 0.3s'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#1db954',
      color: '#fff',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.3s'
    },
    content: {
      maxWidth: '600px',
      margin: '60px auto',
      padding: '0 20px'
    },
    card: {
      backgroundColor: '#282828',
      borderRadius: '12px',
      padding: '40px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '40px'
    },
    title: {
      fontSize: '36px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    subtitle: {
      fontSize: '14px',
      opacity: 0.7,
      marginBottom: 0
    },
    formGroup: {
      marginBottom: '25px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      opacity: 0.9
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      backgroundColor: '#1e1e1e',
      border: '2px solid #404040',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      fontFamily: 'inherit',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.3s'
    },
    inputFocused: {
      borderColor: '#1db954',
      backgroundColor: '#252525',
      boxShadow: '0 0 0 3px rgba(29, 185, 84, 0.1)'
    },
    textarea: {
      width: '100%',
      padding: '14px 16px',
      backgroundColor: '#1e1e1e',
      border: '2px solid #404040',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      fontFamily: 'inherit',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.3s',
      resize: 'vertical',
      minHeight: '100px'
    },
    textareaFocused: {
      borderColor: '#1db954',
      backgroundColor: '#252525',
      boxShadow: '0 0 0 3px rgba(29, 185, 84, 0.1)'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      marginTop: '30px'
    },
    button: {
      flex: 1,
      padding: '14px 24px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    submitButton: {
      backgroundColor: '#1db954',
      color: '#fff'
    },
    cancelButton: {
      backgroundColor: 'transparent',
      color: '#fff',
      border: '2px solid #404040'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    alert: {
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
      border: '1px solid #ff6b6b',
      color: '#ff6b6b',
      padding: '14px 16px',
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px',
      fontWeight: '500'
    },
    charCount: {
      fontSize: '12px',
      opacity: 0.6,
      marginTop: '6px',
      textAlign: 'right'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        input:hover {
          border-color: #1db954 !important;
        }
        textarea:hover {
          border-color: #1db954 !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>

      {/* Navbar */}
      <div style={styles.navbar}>
        <div 
          style={styles.navBrand}
          onClick={() => navigate('/home')}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          🎵 Music App
        </div>
        <button
          style={styles.backButton}
          onClick={() => navigate('/home')}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1ed760'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1db954'}
        >
          ← Back to Home
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={{ fontSize: '50px', marginBottom: '20px' }}>🎵</div>
            <h1 style={styles.title}>Create New Playlist</h1>
            <p style={styles.subtitle}>Build your personalized music collection</p>
          </div>

          {error && (
            <div style={styles.alert}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>Playlist Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...styles.input,
                  ...(focusedField === 'name' ? styles.inputFocused : {})
                }}
                placeholder="My Awesome Playlist"
                maxLength="100"
                autoComplete="off"
                required
              />
              <div style={styles.charCount}>
                {formData.name.length}/100
              </div>
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="description" style={styles.label}>Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                onFocus={() => setFocusedField('description')}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...styles.textarea,
                  ...(focusedField === 'description' ? styles.textareaFocused : {})
                }}
                placeholder="Add a description for your playlist (optional)"
                maxLength="500"
                autoComplete="off"
              />
              <div style={styles.charCount}>
                {formData.description.length}/500
              </div>
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="button"
                style={{
                  ...styles.button,
                  ...styles.cancelButton
                }}
                onClick={() => navigate('/home')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3E3E3E'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  ...styles.button,
                  ...styles.submitButton,
                  ...(loading ? styles.buttonDisabled : {})
                }}
                disabled={loading}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1ed760')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1db954')}
              >
                {loading ? '⏳ Creating...' : '✨ Create Playlist'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePlaylist;
