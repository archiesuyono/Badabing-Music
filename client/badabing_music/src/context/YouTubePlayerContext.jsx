import { createContext, useContext, useState } from 'react';

const YouTubePlayerContext = createContext();

export const YouTubePlayerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);

  const openPlayer = (track, tracks = []) => {
    setCurrentTrack(track);
    setQueue(tracks.length > 0 ? tracks : [track]);
    setIsOpen(true);
  };

  const closePlayer = () => {
    setIsOpen(false);
    // Optionally reset after close animation
    setTimeout(() => {
      setCurrentTrack(null);
      setQueue([]);
    }, 300);
  };

  const playTrack = (track, tracks = []) => {
    openPlayer(track, tracks);
  };

  return (
    <YouTubePlayerContext.Provider
      value={{
        isOpen,
        currentTrack,
        queue,
        openPlayer,
        closePlayer,
        playTrack,
        setQueue
      }}
    >
      {children}
    </YouTubePlayerContext.Provider>
  );
};

export const useYouTubePlayer = () => {
  const context = useContext(YouTubePlayerContext);
  if (!context) {
    throw new Error('useYouTubePlayer must be used within YouTubePlayerProvider');
  }
  return context;
};
