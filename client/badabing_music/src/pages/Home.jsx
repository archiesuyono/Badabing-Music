import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { playlistAPI, favoriteAPI, musicAPI } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useYouTubePlayer } from '../context/YouTubePlayerContext';
import apiClient from '../api/apiClient';
import Search from '../components/Search';

export const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { playTrack } = useYouTubePlayer();
  const [playlists, setPlaylists] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [genreTracks, setGenreTracks] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const genres = [
    // Current Popular
    { name: 'Top Pop Music', query: 'pop hits' },
    { name: 'Trending Music', query: 'trending' },
    
    // Music Genres
    { name: 'Rock Music', query: 'rock' },
    { name: 'Hip Hop / Rap', query: 'hip hop' },
    { name: 'Jazz & Soul', query: 'jazz' },
    { name: 'Electronic Music', query: 'electronic' },
    { name: 'Alternative / Indie', query: 'alternative' },
    { name: 'R&B / Soul', query: 'r&b' },
    { name: 'Latin / Reggaeton', query: 'reggaeton' },
    { name: 'Classical / Piano', query: 'classical' },
    { name: 'EDM / Dance', query: 'dance' },
    { name: 'Funk / Disco', query: 'funk' },
    { name: 'Reggae', query: 'reggae' },
    { name: 'K-pop', query: 'k-pop' },
    { name: 'Metal', query: 'metal' },
    { name: 'Acoustic / Folk', query: 'acoustic' },
    
    // Decades
    { name: '🎵 1970s Hits', query: 'hits from the 70s' },
    { name: '🎵 1980s Hits', query: 'hits from the 80s' },
    { name: '🎵 1990s Hits', query: 'hits from the 90s' },
    { name: '🎵 2000s Hits', query: 'hits from the 2000s' },
    { name: '🎵 2010s Hits', query: 'hits from the 2010s' },
  ];

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Listen for favorite updates and refetch
  useEffect(() => {
    const handleFavoriteUpdate = async () => {
      console.log('📢 Favorite updated event received, refetching...');
      try {
        const favoritesRes = await favoriteAPI.getAll();
        setFavorites(favoritesRes.data.data || []);
        console.log('✅ Favorites refreshed');
      } catch (err) {
        console.error('❌ Failed to refetch favorites:', err);
      }
    };

    window.addEventListener('favoriteUpdated', handleFavoriteUpdate);
    return () => window.removeEventListener('favoriteUpdated', handleFavoriteUpdate);
  }, []);

  // Listen for playlist updates and refetch
  useEffect(() => {
    const handlePlaylistUpdate = async () => {
      console.log('📢 Playlist updated event received, refetching...');
      try {
        const playlistsRes = await playlistAPI.getAll();
        setPlaylists(playlistsRes.data.data || []);
        console.log('✅ Playlists refreshed');
      } catch (err) {
        console.error('❌ Failed to refetch playlists:', err);
      }
    };

    window.addEventListener('playlistUpdated', handlePlaylistUpdate);
    return () => window.removeEventListener('playlistUpdated', handlePlaylistUpdate);
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch playlists and favorites
      const [playlistsRes, favoritesRes] = await Promise.all([
        playlistAPI.getAll(),
        favoriteAPI.getAll()
      ]);
      
      setPlaylists(playlistsRes.data.data || []);
      setFavorites(favoritesRes.data.data || []);

      // Fetch tracks by genre
      const genreData = {};
      await Promise.all(
        genres.map(async (genre) => {
          try {
            const res = await musicAPI.searchByGenre(genre.query, 6);
            genreData[genre.query] = {
              displayName: genre.name,
              tracks: res.data.data.tracks || []
            };
          } catch (err) {
            console.error(`Failed to fetch $genre.query:`, err);
            genreData[genre.query] = {
              displayName: genre.name,
              tracks: []
            };
          }
        })
      );
      
      setGenreTracks(genreData);
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track, tracks) => {
    playTrack(track, tracks);
  };

  const handleOpenPlaylistModal = async (playlist) => {
    try {
      const res = await apiClient.get(`/playlists/${playlist.id}`);
      setSelectedPlaylist(playlist);
      // Akses Songs dari berbagai kemungkinan struktur response
      const songs = res.data.data?.Songs || res.data.Songs || [];
      setPlaylistSongs(songs);
      setShowPlaylistModal(true);
      console.log('✅ Playlist modal opened with songs:', songs);
    } catch (err) {
      console.error('❌ Failed to load playlist songs:', err);
      alert('Failed to load playlist songs: ' + err.message);
    }
  };

  const handleRemoveFromFavorites = async (songId) => {
    try {
      await favoriteAPI.remove(songId);
      setFavorites(favorites.filter(f => f.id !== songId));
      window.dispatchEvent(new Event('favoriteUpdated'));
    } catch (err) {
      console.error('Failed to remove from favorites:', err);
    }
  };

  const handleRemoveFromPlaylist = async (songId) => {
    try {
      await playlistAPI.removeSong(selectedPlaylist.id, songId);
      setPlaylistSongs(playlistSongs.filter(s => s.id !== songId));
      window.dispatchEvent(new Event('playlistUpdated'));
    } catch (err) {
      console.error('Failed to remove from playlist:', err);
    }
  };

  const handleDeletePlaylist = async () => {
    try {
      setDeletingPlaylistId(selectedPlaylist.id);
      await apiClient.delete(`/playlists/${selectedPlaylist.id}`);
      setShowPlaylistModal(false);
      setShowDeleteConfirm(false);
      setSelectedPlaylist(null);
      setPlaylists(playlists.filter(p => p.id !== selectedPlaylist.id));
      window.dispatchEvent(new Event('playlistUpdated'));
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    } finally {
      setDeletingPlaylistId(null);
    }
  };

  const handlePlayTrackFromFavoritesModal = (song) => {
    handlePlayTrack(song, favorites);
    setShowFavoritesModal(false);
  };

  const handlePlayTrackFromPlaylistModal = (song) => {
    handlePlayTrack(song, playlistSongs);
    setShowPlaylistModal(false);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', color: '#fff' }}>
      <nav className="navbar navbar-dark bg-dark sticky-top" style={{ zIndex: 1030 }}>
        <div className="container-fluid">
          <span 
            className="navbar-brand mb-0 h1"
            style={{ cursor: 'pointer' }}
          >
            🎵 Music App
          </span>
          <button 
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate('/profile')}
          >
            Profile
          </button>
        </div>
      </nav>

      <div className="container-fluid" style={{ paddingBottom: '80px', paddingLeft: '40px', paddingRight: '40px', paddingTop: '20px' }}>
        
        {/* Welcome Banner */}
        <div className="mb-5" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '60px 40px',
          borderRadius: '12px',
          marginBottom: '60px'
        }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '10px' }}>
            Welcome, {user?.username || (user?.email ? user.email.split('@')[0] : 'Guest')} 👋
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.9 }}>
            Discover music, create playlists, and enjoy your favorites
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-5">
          <Search />
        </div>

        {/* Your Favorite Songs Section */}
        {favorites.length > 0 && (
          <div className="mb-5">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                  Your Favorite Songs
                </h2>
                <button 
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: 0,
                    opacity: 0.8,
                    transition: 'opacity 0.3s'
                  }}
                  onClick={() => setShowFavoritesModal(true)}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                >
                  See All
                </button>
              </div>
            </div>
            <div className="row">
              {favorites.slice(0, 6).map((song) => (
                <div key={song.id} className="col-md-6 col-lg-4 mb-4">
                  <div 
                    style={{
                      backgroundColor: '#282828',
                      padding: '16px',
                      borderRadius: '8px',
                      transition: 'transform 0.3s, background-color 0.3s',
                      cursor: 'pointer'
                    }}
                    onClick={() => handlePlayTrack(song, favorites)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3E3E3E';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#282828';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {song.imageUrl && (
                      <img
                        src={song.imageUrl}
                        alt={song.title}
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}
                      />
                    )}
                    <h5 style={{ marginBottom: '8px', fontWeight: 'bold' }}>{song.title}</h5>
                    <p style={{ marginBottom: '4px', opacity: 0.7, fontSize: '14px' }}>
                      {song.artists?.join(', ')}
                    </p>
                    <small style={{ opacity: 0.6 }}>{song.album}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Playlists Section */}
        {playlists.length > 0 ? (
          <div className="mb-5">
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>
              Your Playlists
            </h2>
            <div className="row">
              {playlists.slice(0, 6).map((playlist) => (
                <div key={playlist.id} className="col-md-6 col-lg-4 mb-4">
                  <div
                    onClick={() => handleOpenPlaylistModal(playlist)}
                    style={{
                      backgroundColor: '#282828',
                      padding: '16px',
                      borderRadius: '8px',
                      transition: 'transform 0.3s, background-color 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3E3E3E';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#282828';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#404040',
                        width: '100%',
                        height: '180px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '60px',
                        marginBottom: '12px'
                      }}
                    >
                      🎵
                    </div>
                    <h5 style={{ marginBottom: '8px', fontWeight: 'bold' }}>{playlist.name}</h5>
                    <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '4px' }}>
                      {playlist.description || 'No description'}
                    </p>
                    <small style={{ opacity: 0.6 }}>
                      {playlist.Songs?.length || 0} songs
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>
              Your Playlists
            </h2>
            <div
              onClick={() => navigate('/playlist/create')}
              style={{
                backgroundColor: '#282828',
                padding: '40px',
                borderRadius: '12px',
                transition: 'transform 0.3s, background-color 0.3s',
                cursor: 'pointer',
                textAlign: 'center',
                border: '2px dashed #667eea'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3E3E3E';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#282828';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎵</div>
              <h3 style={{ marginBottom: '10px', fontWeight: 'bold', color: '#fff' }}>
                Create Your Playlist
              </h3>
              <p style={{ opacity: 0.7, fontSize: '16px', marginBottom: 0 }}>
                Start building your personalized music collection
              </p>
            </div>
          </div>
        )}

        {/* Genre Sections */}
        {Object.entries(genreTracks).map(([genreKey, genreData]) => (
          genreData.tracks.length > 0 && (
            <div key={genreKey} className="mb-5">
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>
                {genreData.displayName}
              </h2>
              <div className="row">
                {genreData.tracks.map((track) => (
                  <div key={track.spotifyId || track.id} className="col-md-6 col-lg-4 col-xl-2 mb-4">
                    <div 
                      style={{
                        backgroundColor: '#282828',
                        padding: '12px',
                        borderRadius: '8px',
                        transition: 'transform 0.3s, background-color 0.3s',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                      onClick={() => handlePlayTrack(track, genreData.tracks)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#3E3E3E';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#282828';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      {track.imageUrl && (
                        <img
                          src={track.imageUrl}
                          alt={track.title}
                          style={{
                            width: '100%',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            marginBottom: '10px'
                          }}
                        />
                      )}
                      <h6 style={{ 
                        marginBottom: '6px', 
                        fontWeight: 'bold',
                        fontSize: '13px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {track.title}
                      </h6>
                      <small style={{ 
                        opacity: 0.7, 
                        fontSize: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}>
                        {track.artists?.[0] || 'Unknown'}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Favorites Modal */}
      {showFavoritesModal && (
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
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={() => setShowFavoritesModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              color: '#fff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>All Favorite Songs</h2>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowFavoritesModal(false)}
              />
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {favorites.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.7 }}>No favorite songs yet</p>
              ) : (
                favorites.map((song) => (
                  <div
                    key={song.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#282828',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3E3E3E'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                  >
                    {song.imageUrl && (
                      <img
                        src={song.imageUrl}
                        alt={song.title}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          marginRight: '12px'
                        }}
                      />
                    )}
                    <div 
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => handlePlayTrackFromFavoritesModal(song)}
                    >
                      <h6 style={{ margin: 0, fontWeight: 'bold', marginBottom: '4px' }}>{song.title}</h6>
                      <small style={{ opacity: 0.7 }}>{song.artists?.join(', ')}</small>
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemoveFromFavorites(song.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Playlist Detail Modal */}
      {showPlaylistModal && selectedPlaylist && (
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
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={() => setShowPlaylistModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              color: '#fff'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{selectedPlaylist.name}</h2>
                <small style={{ opacity: 0.7 }}>{playlistSongs.length} songs</small>
              </div>
              <button 
                className="btn-close btn-close-white"
                onClick={() => setShowPlaylistModal(false)}
              />
            </div>

            <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '20px' }}>
              {playlistSongs.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.7 }}>No songs in this playlist</p>
              ) : (
                playlistSongs.map((song) => (
                  <div
                    key={song.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: '#282828',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3E3E3E'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                  >
                    {song.imageUrl && (
                      <img
                        src={song.imageUrl}
                        alt={song.title}
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          marginRight: '12px'
                        }}
                      />
                    )}
                    <div 
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => handlePlayTrackFromPlaylistModal(song)}
                    >
                      <h6 style={{ margin: 0, fontWeight: 'bold', marginBottom: '4px' }}>{song.title}</h6>
                      <small style={{ opacity: 0.7 }}>{song.artists?.join(', ')}</small>
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemoveFromPlaylist(song.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              className="btn btn-danger w-100"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deletingPlaylistId === selectedPlaylist.id}
            >
              {deletingPlaylistId === selectedPlaylist.id ? 'Deleting...' : 'Delete Playlist'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Playlist Confirmation Modal */}
      {showDeleteConfirm && selectedPlaylist && (
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
          onClick={() => setShowDeleteConfirm(false)}
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
              Delete Playlist?
            </h3>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>
              Are you sure you want to delete "<strong>{selectedPlaylist.name}</strong>"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary flex-grow-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger flex-grow-1"
                onClick={handleDeletePlaylist}
                disabled={deletingPlaylistId === selectedPlaylist.id}
              >
                {deletingPlaylistId === selectedPlaylist.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
