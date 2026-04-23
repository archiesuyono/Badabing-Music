import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFavorites, removeFavorite } from '../store/slices/favoritesSlice';
import { fetchPlaylists, addSongToPlaylist, removeSongFromPlaylist } from '../store/slices/playlistsSlice';
import { useYouTubePlayer } from '../context/YouTubePlayerContext';

export const Favorites = () => {
  const dispatch = useDispatch();
  const { playTrack } = useYouTubePlayer();

  // Ambil data langsung dari Redux store
  const favorites = useSelector((state) => state.favorites.items);
  const playlists = useSelector((state) => state.playlists.items);
  const loading = useSelector((state) => state.favorites.loading);
  const error = useSelector((state) => state.favorites.error);

  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmSongId, setConfirmSongId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  useEffect(() => {
    // Fetch dari server kalau belum ada data
    if (favorites.length === 0) dispatch(fetchFavorites());
    if (playlists.length === 0) dispatch(fetchPlaylists());
  }, [dispatch]);

  // Cek apakah lagu sudah ada di playlist tertentu
  const isSongInPlaylist = (songId, playlistId) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist || !playlist.Songs) return false;
    return playlist.Songs.some((s) => s.id === songId);
  };

  const handleRemoveClick = (songId) => {
    setConfirmSongId(songId);
    setShowConfirm(true);
  };

  const handleConfirmRemove = async () => {
    if (!confirmSongId) return;
    const result = await dispatch(removeFavorite(confirmSongId));
    if (removeFavorite.fulfilled.match(result)) {
      showToast('Removed from favorites!', 'success');
    } else {
      showToast(result.payload || 'Failed to remove', 'error');
    }
    setShowConfirm(false);
    setConfirmSongId(null);
  };

  const handlePlayTrack = (track) => {
    playTrack(track, favorites);
  };

  const handleAddRemovePlaylist = async (song, playlistId) => {
    const alreadyIn = isSongInPlaylist(song.id, playlistId);

    if (alreadyIn) {
      const result = await dispatch(removeSongFromPlaylist({ playlistId, songId: song.id }));
      if (removeSongFromPlaylist.fulfilled.match(result)) {
        showToast('❌ Removed from playlist', 'success');
      } else {
        showToast('Failed to update playlist', 'error');
      }
    } else {
      const result = await dispatch(addSongToPlaylist({ playlistId, song }));
      if (addSongToPlaylist.fulfilled.match(result)) {
        showToast('✅ Added to playlist!', 'success');
      } else {
        showToast('Failed to update playlist', 'error');
      }
    }
  };

  if (loading) return <div className="container py-4"><p>Loading...</p></div>;

  return (
    <div className="container py-4">
      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`}
          role="alert"
          style={{ top: '80px', right: '20px', zIndex: 9999, minWidth: '300px' }}
        >
          {toast.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setToast((t) => ({ ...t, visible: false }))}
          ></button>
        </div>
      )}

      <h2 className="mb-4">❤️ My Favorites</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="alert alert-info">No favorite songs yet. Add some!</div>
      ) : (
        <div className="row">
          {favorites.map((song) => (
            <div key={song.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                {song.imageUrl && (
                  <img src={song.imageUrl} className="card-img-top" alt={song.title} />
                )}
                <div className="card-body">
                  <h5 className="card-title">{song.title}</h5>
                  <p className="card-text text-muted">{song.artists?.join(', ')}</p>
                </div>
                {song.previewUrl && (
                  <div className="card-body">
                    <audio controls className="w-100" style={{ height: '32px' }}>
                      <source src={song.previewUrl} type="audio/mpeg" />
                    </audio>
                  </div>
                )}
                <div className="card-footer bg-light">
                  <div className="d-flex gap-2 mb-2">
                    <button
                      className="btn btn-sm btn-warning flex-grow-1"
                      onClick={() => handlePlayTrack(song)}
                      title="Play"
                    >
                      ▶️ Play
                    </button>
                    <div className="dropdown flex-grow-1">
                      <button
                        className="btn btn-sm btn-info w-100 dropdown-toggle"
                        type="button"
                        id={`playlist-${song.id}`}
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        📋
                      </button>
                      <ul className="dropdown-menu" aria-labelledby={`playlist-${song.id}`}>
                        {playlists.length > 0 ? (
                          playlists.map((playlist) => {
                            const isIn = isSongInPlaylist(song.id, playlist.id);
                            return (
                              <li key={playlist.id}>
                                <button
                                  className={`dropdown-item ${isIn ? 'text-danger' : ''}`}
                                  onClick={() => handleAddRemovePlaylist(song, playlist.id)}
                                >
                                  {isIn ? '✓ ' : '+ '}{playlist.name}
                                </button>
                              </li>
                            );
                          })
                        ) : (
                          <li><span className="dropdown-item disabled">No playlists</span></li>
                        )}
                      </ul>
                    </div>
                    <button
                      className="btn btn-sm btn-danger flex-grow-1"
                      onClick={() => handleRemoveClick(song.id)}
                      title="Remove from favorites"
                    >
                      ✕
                    </button>
                  </div>
                  <button
                    className="btn btn-sm btn-success w-100"
                    onClick={() =>
                      window.open(
                        `https://open.spotify.com/search/${encodeURIComponent(
                          song.title + ' ' + (song.artists?.[0] || '')
                        )}`,
                        '_blank'
                      )
                    }
                  >
                    ▶️ Spotify
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {showConfirm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Remove</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirm(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to remove this song from favorites?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmRemove}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;
