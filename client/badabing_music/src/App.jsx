import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { YouTubePlayerProvider, useYouTubePlayer } from './context/YouTubePlayerContext';
import Login from './components/Login';
import Register from './components/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreatePlaylist from './pages/CreatePlaylist';
import MusicOn from './components/MusicOn';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const { isOpen, currentTrack, queue, closePlayer } = useYouTubePlayer();

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/home" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/home" />} />
          <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/playlist/create" element={isAuthenticated ? <CreatePlaylist /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/login'} />} />
        </Routes>
      </BrowserRouter>
      
      {/* Global Music Player */}
      {isOpen && currentTrack && (
        <MusicOn 
          track={currentTrack}
          queue={queue}
          onClose={closePlayer}
        />
      )}
    </>
  );
}

function App() {
  return (
    <YouTubePlayerProvider>
      <AppContent />
    </YouTubePlayerProvider>
  );
}

export default App;
