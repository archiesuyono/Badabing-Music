import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Debug log
  console.log('User object:', user);

  // Extract username display - if google login use part before @
  const displayUsername = user?.username || (user?.email ? user.email.split('@')[0] : 'Guest');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
      <nav className="navbar navbar-dark bg-dark sticky-top" style={{ zIndex: 1030 }}>
        <div className="container-fluid">
          <span 
            className="navbar-brand mb-0 h1"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/home')}
          >
            🎵 Music App
          </span>
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate('/home')}
          >
            Back to Home
          </button>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px', maxWidth: '600px' }}>
        {/* Profile Card */}
        <div style={{
          backgroundColor: '#282828',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '30px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#667eea',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px'
            }}>
              👤
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
              {displayUsername}
            </h1>
          </div>

          {/* Profile Info */}
          <div style={{
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                opacity: 0.7, 
                marginBottom: '8px',
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}>
                Email
              </label>
              <p style={{ 
                margin: 0, 
                fontSize: '16px',
                wordBreak: 'break-all'
              }}>
                {user?.email || 'N/A'}
              </p>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                opacity: 0.7, 
                marginBottom: '8px',
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}>
                Username
              </label>
              <p style={{ 
                margin: 0, 
                fontSize: '16px'
              }}>
                {displayUsername}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              className="btn btn-outline-light"
              onClick={() => setShowLogoutConfirm(true)}
              style={{ width: '100%' }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '20px'
          }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '400px',
              width: '100%',
              color: '#fff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>
              Logout?
            </h3>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary flex-grow-1"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning flex-grow-1"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
