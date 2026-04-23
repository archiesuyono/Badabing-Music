import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';   // <-- hook Redux
import { useAuth } from '../context/AuthContext';
import { useYouTubePlayer } from '../context/YouTubePlayerContext';
import { fetchFavorites, removeFavorite } from '../store/slices/favoritesSlice';
import { fetchPlaylists, deletePlaylist, removeSongFromPlaylist } from '../store/slices/playlistsSlice';
import { fetchGenreTracks, GENRES } from '../store/slices/musicSlice';
import apiClient from '../api/apiClient';
import Search from '../components/Search';

export const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const { playTrack } = useYouTubePlayer();

  // Ambil data dari Redux store — tidak perlu useState lagi untuk data ini
  const favorites = useSelector((state) => state.favorites.items);
  const playlists = useSelector((state) => state.playlists.items);
  const genreTracks = useSelector((state) => state.music.genreTracks);
  const loadingGenres = useSelector((state) => state.music.loadingGenres);
  const loadingFavorites = useSelector((state) => state.favorites.loading);
  const loadingPlaylists = useSelector((state) => state.playlists.loading);

  // State lokal untuk UI saja (modal, dll) — ini tetap pakai useState
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isLoading = loadingGenres || loadingFavorites || loadingPlaylists;

  useEffect(() => {
    // Dispatch ke Redux — ini yang akan fetch data dan menyimpannya di store
    dispatch(fetchFavorites());
    dispatch(fetchPlaylists());
    dispatch(fetchGenreTracks());
  }, [dispatch]);

  const handlePlayTrack = (track, tracks) => {
    playTrack(track, tracks);
  };

  const handleOpenPlaylistModal = async (playlist) => {
    try {
      const res = await apiClient.get(`/playlists/${playlist.id}`);
      setSelectedPlaylist(playlist);
      const songs = res.data.data?.Songs || res.data.Songs || [];
      setPlaylistSongs(songs);
      setShowPlaylistModal(true);
    } catch (err) {
      console.error('Gagal memuat lagu playlist:', err);
      alert('Failed to load playlist songs: ' + err.message);
    }
  };

  const handleRemoveFromFavorites = async (songId) => {
    // Dispatch action Redux, bukan fetch manual
    dispatch(removeFavorite(songId));
  };

  const handleRemoveFromPlaylist = async (songId) => {
    if (!selectedPlaylist) return;
    dispatch(removeSongFromPlaylist({ playlistId: selectedPlaylist.id, songId }));
    setPlaylistSongs(playlistSongs.filter((s) => s.id !== songId));
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylist) return;
    setDeletingPlaylistId(selectedPlaylist.id);
    await dispatch(deletePlaylist(selectedPlaylist.id));
    setShowPlaylistModal(false);
    setShowDeleteConfirm(false);
    setSelectedPlaylist(null);
    setDeletingPlaylistId(null);
  };

  const handlePlayTrackFromFavoritesModal = (song) => {
    handlePlayTrack(song, favorites);
    setShowFavoritesModal(false);
  };

  const handlePlayTrackFromPlaylistModal = (song) => {
    handlePlayTrack(song, playlistSongs);
    setShowPlaylistModal(false);
  };

  if (isLoading) {
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
          <span className="navbar-brand mb-0 h1" style={{ cursor: 'pointer' }}>
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

      <div style={{ padding: '20px' }}>
        {/* Search Component */}
        <Search />

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div
            style={{
              backgroundColor: '#282828',
              borderRadius: '8px',
              padding: '16px 20px',
              cursor: 'pointer',
              flex: 1,
              minWidth: '150px',
            }}
            onClick={() => setShowFavoritesModal(true)}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>❤️</div>
            <div style={{ fontWeight: 'bold', fontSize: '20px' }}>{favorites.length}</div>
            <div style={{ opacity: 0.7, fontSize: '13px' }}>Favorite Songs</div>
          </div>

          <div
            style={{
              backgroundColor: '#282828',
              borderRadius: '8px',
              padding: '16px 20px',
              cursor: 'pointer',
              flex: 1,
              minWidth: '150px',
            }}
            onClick={() => navigate('/playlist/create')}
          >
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎵</div>
            <div style={{ fontWeight: 'bold', fontSize: '20px' }}>{playlists.length}</div>
            <div style={{ opacity: 0.7, fontSize: '13px' }}>Playlists</div>
          </div>
        </div>

        {/* Playlists Section */}
        {playlists.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>🎵 My Playlists</h2>
              <button
                className="btn btn-sm btn-outline-light"
                onClick={() => navigate('/playlist/create')}
              >
                + New
              </button>
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px' }}>
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  style={{
                    minWidth: '160px',
                    backgroundColor: '#282828',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => handleOpenPlaylistModal(playlist)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3E3E3E')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#282828')}
                >
                  <div style={{ fontSize: '40px', marginBottom: '10px', textAlign: 'center' }}>♪</div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                    {playlist.name}
                  </div>
                  <div style={{ opacity: 0.6, fontSize: '12px' }}>
                    {playlist.Songs?.length || 0} lagu
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Genre Tracks Section */}
        {GENRES.map((genre) => {
          const genreData = genreTracks[genre.query];
          if (!genreData || genreData.tracks.length === 0) return null;

          return (
            <div key={genre.query} style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '16px' }}>
                {genreData.displayName}
              </h2>
              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '10px' }}>
                {genreData.tracks.map((track) => (
                  <div
                    key={track.id}
                    style={{
                      minWidth: '160px',
                      backgroundColor: '#282828',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => handlePlayTrack(track, genreData.tracks)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3E3E3E')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#282828')}
                  >
                    {track.imageUrl && (
                      <img
                        src={track.imageUrl}
                        alt={track.title}
                        style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
                        {track.title}
                      </div>
                      <div style={{ opacity: 0.6, fontSize: '12px' }}>
                        {track.artists?.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: All Favorites */}
      {showFavoritesModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
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
              color: '#fff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>All Favorite Songs</h2>
              <button className="btn-close btn-close-white" onClick={() => setShowFavoritesModal(false)} />
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
                      transition: 'background-color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3E3E3E')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#282828')}
                  >
                    {song.imageUrl && (
                      <img
                        src={song.imageUrl}
                        alt={song.title}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', marginRight: '12px' }}
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

      {/* Modal: Playlist Detail */}
      {showPlaylistModal && selectedPlaylist && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
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
              color: '#fff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{selectedPlaylist.name}</h2>
                <small style={{ opacity: 0.7 }}>{playlistSongs.length} songs</small>
              </div>
              <button className="btn-close btn-close-white" onClick={() => setShowPlaylistModal(false)} />
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
                      transition: 'background-color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3E3E3E')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#282828')}
                  >
                    {song.imageUrl && (
                      <img
                        src={song.imageUrl}
                        alt={song.title}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', marginRight: '12px' }}
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

      {/* Modal: Konfirmasi Hapus Playlist */}
      {showDeleteConfirm && selectedPlaylist && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '20px',
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
              color: '#fff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>Delete Playlist?</h3>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>
              Yakin mau hapus "<strong>{selectedPlaylist.name}</strong>"? Aksi ini tidak bisa dibatalkan.
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
