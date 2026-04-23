import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api/endpoints';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      console.log('🔄 Fetching profile...');
      const response = await authAPI.getProfile();
      console.log('✅ Profile response:', response.data);
      
      // Handle both response formats: { data: {...} } or direct {...}
      const userData = response.data.data || response.data;
      console.log('✅ User set to:', userData);
      setUser(userData);
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      console.error('❌ Error response:', error.response?.data);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, username, password) => {
    try {
      const response = await authAPI.register(email, username, password);
      const { token: newToken, user: userData } = response.data.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token: newToken, user: userData } = response.data.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const response = await authAPI.googleLogin(googleToken);
      const { token: newToken, user: userData } = response.data.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    updateProfile,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
