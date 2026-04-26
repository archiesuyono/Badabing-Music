import { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import apiClient from '../api/apiClient';

export const MusicOn = ({ track, queue = [], onClose }) => {
  const [videoId, setVideoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [enableRealTimeSync, setEnableRealTimeSync] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(track);
  const [currentIndex, setCurrentIndex] = useState(queue.findIndex(t => t.id === track.id) || 0);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [playlistsWithSong, setPlaylistsWithSong] = useState(new Set());
  const playerRef = useRef(null);
  const lyricsContainerRef = useRef(null);

  useEffect(() => {
    if (showLyrics) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [showLyrics]);

  // Fetch playlists for dropdown
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await apiClient.get('/playlists');
        setPlaylists(response.data.data || response.data || []);
      } catch (err) {
        console.error('Failed to fetch playlists:', err);
      }
    };
    fetchPlaylists();
  }, []);

  // Check if current track is in favorites (independent of playlists)
  useEffect(() => {
    if (!currentTrack) return;

    const checkFavoriteStatus = async () => {
      try {
        const trackId = currentTrack.spotifyId || currentTrack.id;
        
        if (!trackId) {
          console.warn('⚠️ No spotifyId or id found for track:', currentTrack);
          setIsFavorite(false);
          return;
        }

        console.log('🎵 Checking favorite status for trackId:', trackId);
        const favResponse = await apiClient.get(`/favorites/${trackId}`);
        const status = favResponse.data?.isFavorite || false;
        console.log('🎵 Favorite status result:', status);
        setIsFavorite(status);
      } catch (err) {
        console.error('❌ Error checking favorite status:', err);
        setIsFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [currentTrack]);

  // Check which playlists contain current track (same pattern as favorites)
  useEffect(() => {
    if (!currentTrack) return;

    const checkPlaylistStatus = async () => {
      try {
        const trackId = currentTrack.spotifyId || currentTrack.id;
        
        if (!trackId) {
          console.warn('⚠️ No spotifyId or id found for track:', currentTrack);
          setPlaylistsWithSong(new Set());
          return;
        }

        console.log('🎵 Checking playlist status for trackId:', trackId);
        
        // Fetch current playlists
        const playlistsResponse = await apiClient.get('/playlists');
        const currentPlaylists = playlistsResponse.data.data || [];
        console.log('🎵 Fetched playlists count:', currentPlaylists.length);
        
        const playlistsSet = new Set();
        for (const playlist of currentPlaylists) {
          try {
            const response = await apiClient.get(`/playlists/${playlist.id}`);
            // Backend returns playlist with Songs array (capital S)
            const songs = response.data.Songs || response.data.data?.songs || [];
            console.log(`🎵 Checking playlist ${playlist.name}, songs count:`, songs.length);
            
            // Check by both spotifyId and database id
            const isInPlaylist = songs.some(song => {
              const match = song.spotifyId === currentTrack.spotifyId || 
                           song.id === currentTrack.id ||
                           song.spotifyId === currentTrack.id;
              if (match) {
                console.log(`✅ Found match in ${playlist.name}`);
              }
              return match;
            });
            
            if (isInPlaylist) {
              playlistsSet.add(playlist.id);
            }
          } catch (err) {
            console.error(`❌ Error checking playlist ${playlist.name}:`, err);
          }
        }
        console.log('🎵 Playlists with song:', Array.from(playlistsSet));
        setPlaylistsWithSong(playlistsSet);
      } catch (err) {
        console.error('❌ Error checking playlists:', err);
        setPlaylistsWithSong(new Set());
      }
    };

    checkPlaylistStatus();
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack) return;

    const searchYouTube = async () => {
      try {
        setLoading(true);
        setVideoId(null);
        const query = `${currentTrack.title} ${currentTrack.artists?.[0] || ''} audio`;
        
        const response = await apiClient.get(`/youtube/search/${encodeURIComponent(query)}`);
        
        if (response.data && response.data.data && response.data.data.videoId) {
          setVideoId(response.data.data.videoId);
          setError(null);
        } else {
          setError('Video not found on YouTube');
        }
      } catch (err) {
        console.error('YouTube search error:', err);
        setError('Failed to search YouTube');
      } finally {
        setLoading(false);
      }
    };

    searchYouTube();
  }, [currentTrack]);

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
  };

  const onPlayerStateChange = (event) => {
    const isPlayerPlaying = event.data === 1;
    setIsPlaying(isPlayerPlaying);
  };

  const handleShowLyrics = async () => {
    if (lyrics) {
      setShowLyrics(!showLyrics);
      return;
    }

    setLyricsLoading(true);
    setLyricsError(null);
    
    try {
      const response = await apiClient.post(`/music/${currentTrack.id}/generate-lyrics`);
      
      if (response.data && response.data.data && response.data.data.lyrics) {
        setLyrics(response.data.data.lyrics);
        setShowLyrics(true);
      } else {
        setLyricsError('No lyrics returned from server');
      }
    } catch (err) {
      console.error('Lyrics error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to fetch lyrics';
      setLyricsError(errorMsg);
    } finally {
      setLyricsLoading(false);
    }
  };

  const handleNextSong = () => {
    if (queue.length === 0 || currentIndex >= queue.length - 1) {
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setCurrentTrack(queue[nextIndex]);
    setLyrics(null);
    setShowLyrics(false);
  };

  const handlePreviousSong = () => {
    if (queue.length === 0 || currentIndex <= 0) {
      return;
    }
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
    setLyrics(null);
    setShowLyrics(false);
  };

  const handleAddToFavorites = async () => {
    try {
      const trackId = currentTrack.spotifyId || currentTrack.id;
      console.log('🎵 [FAVORITE] Attempting add/remove. trackId:', trackId, 'isFavorite:', isFavorite);
      
      if (!trackId) {
        setToastMessage('❌ Cannot identify track');
        return;
      }

      if (isFavorite) {
        console.log('🎵 [FAVORITE] Removing from favorites:', trackId);
        await apiClient.delete(`/favorites/${trackId}`);
        setToastMessage('❌ Removed from favorites');
      } else {
        const payload = {
          spotifyId: currentTrack.spotifyId || currentTrack.id,
          spotifyUri: currentTrack.spotifyUri,
          title: currentTrack.title,
          artists: currentTrack.artists,
          album: currentTrack.album,
          imageUrl: currentTrack.imageUrl,
          duration: currentTrack.duration,
          previewUrl: currentTrack.previewUrl,
          externalUrl: currentTrack.externalUrl
        };
        console.log('🎵 [FAVORITE] Adding to favorites with payload:', payload);
        await apiClient.post('/favorites', payload);
        setToastMessage('✅ Added to favorites!');
      }
      
      // Re-validate status from server after 500ms
      setTimeout(async () => {
        try {
          const trackId = currentTrack.spotifyId || currentTrack.id;
          const favResponse = await apiClient.get(`/favorites/${trackId}`);
          const newStatus = favResponse.data?.isFavorite || false;
          console.log('🎵 [FAVORITE] Re-validated status from server:', newStatus);
          setIsFavorite(newStatus);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('favoriteUpdated', {
            detail: { trackId, isFavorite: newStatus }
          }));
        } catch (err) {
          console.error('❌ Error re-validating favorite status:', err);
        }
      }, 500);
      
    } catch (err) {
      console.error('❌ [FAVORITE] Error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        full: err
      });
      const errorMsg = err.response?.data?.error || err.message || '';
      if (errorMsg.includes('already in favorites') && !isFavorite) {
        setIsFavorite(true);
        setToastMessage('✅ Already in favorites!');
      } else {
        setToastMessage('❌ Action failed');
      }
    } finally {
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      const trackId = currentTrack.spotifyId || currentTrack.id;
      
      if (playlistsWithSong.has(playlistId)) {
        console.log('🎵 Removing from playlist:', { playlistId, trackId });
        await apiClient.delete(`/playlists/${playlistId}/songs/${trackId}`);
        const newSet = new Set(playlistsWithSong);
        newSet.delete(playlistId);
        setPlaylistsWithSong(newSet);
        setToastMessage('❌ Removed from playlist');
      } else {
        console.log('🎵 Adding to playlist:', { playlistId, trackId });
        const payload = {
          spotifyId: currentTrack.spotifyId || currentTrack.id,
          spotifyUri: currentTrack.spotifyUri,
          title: currentTrack.title,
          artists: currentTrack.artists,
          album: currentTrack.album,
          imageUrl: currentTrack.imageUrl,
          duration: currentTrack.duration,
          previewUrl: currentTrack.previewUrl,
          externalUrl: currentTrack.externalUrl
        };
        console.log('🎵 Playlist add payload:', payload);
        await apiClient.post(`/playlists/${playlistId}/songs`, payload);
        const newSet = new Set(playlistsWithSong);
        newSet.add(playlistId);
        setPlaylistsWithSong(newSet);
        setToastMessage('✅ Added to playlist!');
      }
      
      // Re-validate status from server after 500ms
      setTimeout(async () => {
        try {
          const trackId = currentTrack.spotifyId || currentTrack.id;
          const response = await apiClient.get(`/playlists/${playlistId}`);
          const songs = response.data.Songs || response.data.data?.songs || [];
          const isInPlaylist = songs.some(song =>
            song.spotifyId === currentTrack.spotifyId ||
            song.id === currentTrack.id ||
            song.spotifyId === currentTrack.id
          );
          
          console.log('🎵 Re-validated playlist status from server:', { playlistId, isInPlaylist });
          
          const newSet = new Set(playlistsWithSong);
          if (isInPlaylist) {
            newSet.add(playlistId);
          } else {
            newSet.delete(playlistId);
          }
          setPlaylistsWithSong(newSet);
          
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('playlistUpdated', {
            detail: { playlistId, trackId, isInPlaylist }
          }));
        } catch (err) {
          console.error('❌ Error re-validating playlist status:', err);
        }
      }, 500);
      
      setShowPlaylistMenu(false);
    } catch (err) {
      console.error('❌ Add to playlist error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMsg = err.response?.data?.error || err.message || '';
      
      if (errorMsg.includes('already in playlist') && !playlistsWithSong.has(playlistId)) {
        // Mark as already in playlist if we get this error
        console.log('🎵 Song already in playlist, updating state');
        const newSet = new Set(playlistsWithSong);
        newSet.add(playlistId);
        setPlaylistsWithSong(newSet);
        setToastMessage('✅ Already in playlist!');
      } else if (errorMsg.includes('not found')) {
        // If song not found, remove from state
        const newSet = new Set(playlistsWithSong);
        newSet.delete(playlistId);
        setPlaylistsWithSong(newSet);
        setToastMessage('❌ Song not found');
      } else {
        setToastMessage('❌ Action failed');
      }
    } finally {
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  const opts = {
    height: '400',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      modestbranding: 1,
    },
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        backgroundColor: 'rgba(0,0,0,0.7)'
      }}
    >
      <div className="modal-dialog modal-lg" style={{ margin: 'auto' }}>
        <div className="modal-content" style={{ maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', backgroundColor: '#2a2a2a', borderColor: '#444', color: '#fff', filter: 'none', backdropFilter: 'none' }}>
          <div className="modal-header" style={{ borderBottomColor: '#444', backgroundColor: '#333', paddingBottom: '15px' }}>
            <h5 className="modal-title" style={{ color: '#fff', fontSize: '1.3rem' }}>
              🎵 {currentTrack?.title || 'Now Playing'}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
              style={{ filter: 'brightness(2)', opacity: 1 }}
            ></button>
          </div>
          <div className="modal-body" style={{ overflow: 'auto', flex: 1, backgroundColor: '#2a2a2a', color: '#fff' }}>
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {videoId && !loading && (
              <div>
                <YouTube 
                  videoId={videoId} 
                  opts={opts}
                  onReady={onPlayerReady}
                  onStateChange={onPlayerStateChange}
                />
                
                <div className="mt-3" style={{ padding: '10px 0' }}>
                  <h6 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 8px 0', fontFamily: 'Arial, sans-serif', letterSpacing: '0.5px' }}>{currentTrack?.title}</h6>
                  <p style={{ color: '#ccc', marginBottom: '5px', fontSize: '1rem', fontFamily: 'Arial, sans-serif' }}>{currentTrack?.artists?.join(', ')}</p>
                  <p style={{ color: '#999', fontSize: '0.95rem', marginBottom: 0, fontFamily: 'Arial, sans-serif' }}>{currentTrack?.album}</p>
                </div>

                <div className="mt-3">
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleShowLyrics}
                    disabled={lyricsLoading}
                    style={{ backgroundColor: '#0066ff', borderColor: '#0066ff', color: '#fff', fontWeight: 'bold' }}
                  >
                    {lyricsLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Fetching Lyrics...
                      </>
                    ) : showLyrics ? (
                      '📖 Hide Lyrics'
                    ) : (
                      '📖 Show Lyrics'
                    )}
                  </button>
                </div>

                {/* Add to Favorites & Playlists */}
                <div className="mt-3 d-flex gap-2">
                  <button
                    className={`btn flex-grow-1 ${isFavorite ? 'btn-danger' : 'btn-success'}`}
                    onClick={handleAddToFavorites}
                    title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    style={{ fontWeight: 'bold', color: '#fff' }}
                  >
                    {isFavorite ? '❤️ Remove from Favorites' : '❤️ Add to Favorites'}
                  </button>
                  <div className="position-relative flex-grow-1">
                    <button
                      className="btn btn-warning w-100"
                      onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
                      title="Add/Remove Playlist"
                      style={{ fontWeight: 'bold', color: '#000' }}
                    >
                      📋 Playlist
                    </button>
                    {showPlaylistMenu && (
                      <div className="position-absolute top-100 start-0 border rounded mt-1" style={{ zIndex: 1000, minWidth: '240px', borderColor: '#c94c4c', backgroundColor: '#c94c4c', boxShadow: '0 4px 8px rgba(201, 76, 76, 0.3)' }}>
                        {playlists.length > 0 ? (
                          playlists.map((playlist) => {
                            const isInPlaylist = playlistsWithSong.has(playlist.id);
                            return (
                              <button
                                key={playlist.id}
                                className={`d-block w-100 text-start px-3 py-2 btn btn-link`}
                                onClick={() => handleAddToPlaylist(playlist.id)}
                                title={isInPlaylist ? "Remove from playlist" : "Add to playlist"}
                                style={{ backgroundColor: isInPlaylist ? '#a83a3a' : '#c94c4c', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.2)', fontWeight: isInPlaylist ? 'bold' : 'normal', transition: 'all 0.2s' }}
                              >
                                {isInPlaylist ? '✓ ' : '+ '}{playlist.name}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2 text-center" style={{ backgroundColor: '#c94c4c', color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', fontFamily: 'Arial, sans-serif' }}>No playlists</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Spotify Button */}
                <div className="mt-3">
                  <button
                    className="btn btn-success w-100"
                    onClick={() => window.open(`https://open.spotify.com/search/${encodeURIComponent(currentTrack.title + ' ' + (currentTrack.artists?.[0] || ''))}`, '_blank')}
                    title="Open in Spotify"
                    style={{ fontWeight: 'bold', color: '#fff', backgroundColor: '#1DB954', borderColor: '#1DB954' }}
                  >
                    ▶️ Play with Spotify
                  </button>
                </div>

                {/* Navigation Buttons */}
                {queue.length > 0 && (
                  <div className="mt-3 d-flex gap-2">
                    <button
                      className="btn btn-info flex-grow-1"
                      onClick={handlePreviousSong}
                      style={{ fontWeight: 'bold', color: '#fff', backgroundColor: '#0099ff', borderColor: '#0099ff' }}
                      disabled={currentIndex <= 0}
                      title="Previous Song"
                    >
                      ⏮️ Previous
                    </button>
                    <button
                      className="btn btn-info flex-grow-1"
                      onClick={handleNextSong}
                      disabled={currentIndex >= queue.length - 1}
                      title="Next Song"
                    >
                      Next ⏭️
                    </button>
                  </div>
                )}
                
                {queue.length > 0 && (
                  <div className="mt-2 text-center">
                    <small className="text-muted">
                      Song {currentIndex + 1} of {queue.length}
                    </small>
                  </div>
                )}

                {toastMessage && (
                  <div 
                    className="alert alert-success mt-3 mb-0"
                    style={{
                      position: 'fixed',
                      top: '20px',
                      right: '20px',
                      zIndex: 10000,
                      minWidth: '250px',
                      animation: 'fadeInOut 0.5s ease-in-out'
                    }}
                  >
                    {toastMessage}
                  </div>
                )}

                {lyricsError && (
                  <div className="alert alert-danger mt-3 mb-0" role="alert">
                    {lyricsError}
                  </div>
                )}

                {showLyrics && lyrics && (
                  <div className="mt-3">
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="realTimeSyncToggle"
                        checked={enableRealTimeSync}
                        onChange={(e) => setEnableRealTimeSync(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="realTimeSyncToggle">
                        🔄 Real-time Sync
                      </label>
                    </div>
                    <div 
                      ref={lyricsContainerRef}
                      style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        backgroundColor: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        lineHeight: '1.8'
                      }}
                    >
                      {lyrics.split('\n').map((line, idx) => (
                        <div key={idx} className={idx % 2 === 0 ? 'text-dark' : 'text-muted'}>
                          {line || '\u00A0'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicOn;
