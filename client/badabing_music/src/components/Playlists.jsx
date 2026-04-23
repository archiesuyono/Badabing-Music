import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPlaylists,
  createPlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from '../store/slices/playlistsSlice';
import { fetchFavorites, addFavorite, removeFavorite } from '../store/slices/favoritesSlice';
import { useYouTubePlayer } from '../context/YouTubePlayerContext';

export const Playlists = () => {
  const dispatch = useDispatch();
  const { playTrack } = useYouTubePlayer();

  // Ambil data dari Redux store
  const playlists = useSelector((state) => state.playlists.items);
  const favorites = useSelector((state) => state.favorites.items);
  const loading = useSelector((state) => state.playlists.loading);
  const error = useSelector((state) => state.playlists.error);

  // Buat Set ID lagu yang difavoritkan — ini lebih efisien buat cek
  const favoriteSongIds = new Set(favorites.map((f) => f.id));

  // State lokal buat UI saja
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistSongs, setPlaylistSongs] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPlaylistId, setConfirmPlaylistId] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  };

  useEffect(() => {
    // Load data kalau belum ada di store
    if (playlists.length === 0) dispatch(fetchPlaylists());
    if (favorites.length === 0) dispatch(fetchFavorites());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createPlaylist({ name: formData.name, description: formData.description }));
    if (createPlaylist.fulfilled.match(result)) {
      setFormData({ name: '', description: '' });
      setShowForm(false);
      showToast('Playlist created successfully!', 'success');
      // Refresh biar dapat data terbaru dari server (termasuk ID yang baru)
      dispatch(fetchPlaylists());
    } else {
      showToast(result.payload || 'Failed to create playlist', 'error');
    }
  };

  const handleViewPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistSongs(playlist.Songs || []);
    setShowViewModal(true);
  };

  const handleRemoveSongFromPlaylist = async (songId) => {
    if (!selectedPlaylist) return;
    const result = await dispatch(removeSongFromPlaylist({ playlistId: selectedPlaylist.id, songId }));
    if (removeSongFromPlaylist.fulfilled.match(result)) {
      setPlaylistSongs((prev) => prev.filter((s) => s.id !== songId));
      showToast('Song removed from playlist!', 'success');
    } else {
      showToast(result.payload || 'Failed to remove song', 'error');
    }
  };

  const handleDeleteClick = (playlistId) => {
    setConfirmPlaylistId(playlistId);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmPlaylistId) return;
    const result = await dispatch(deletePlaylist(confirmPlaylistId));
    if (deletePlaylist.fulfilled.match(result)) {
      showToast('Playlist deleted successfully!', 'success');
    } else {
      showToast(result.payload || 'Failed to delete playlist', 'error');
    }
    setShowConfirm(false);
    setConfirmPlaylistId(null);
  };

  const handlePlayTrack = (track) => {
    playTrack(track, playlistSongs);
  };

  const handleAddRemoveFavorite = async (track) => {
    if (favoriteSongIds.has(track.id)) {
      const result = await dispatch(removeFavorite(track.id));
      if (removeFavorite.fulfilled.match(result)) {
        showToast('❌ Removed from favorites', 'success');
      } else {
        showToast('Failed to update favorite', 'error');
      }
    } else {
      const result = await dispatch(addFavorite(track));
      if (addFavorite.fulfilled.match(result)) {
        showToast('✅ Added to favorites!', 'success');
      } else {
        showToast('Failed to update favorite', 'error');
      }
    }
  };

  if (loading) return <div className="container py-4"><p>Loading...</p></div>;

  return (
    <div className="container py-4">
      {/* Toast */}
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

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🎵 My Playlists</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Playlist'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4">
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Playlist Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                className="form-control"
                id="description"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-success">Create Playlist</button>
          </div>
        </form>
      )}

      {playlists.length === 0 ? (
        <div className="alert alert-info">No playlists yet. Create one to get started!</div>
      ) : (
        <div className="row">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div
                  className="card-img-top bg-primary d-flex align-items-center justify-content-center"
                  style={{ height: '200px', color: 'white', fontSize: '48px' }}
                >
                  {playlist.coverImage ? (
                    <img
                      src={playlist.coverImage}
                      alt={playlist.name}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  ) : (
                    '♪'
                  )}
                </div>
                <div className="card-body">
                  <h5 className="card-title">{playlist.name}</h5>
                  {playlist.description && (
                    <p className="card-text" style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#495057' }}>
                      ✨ {playlist.description}
                    </p>
                  )}
                  <small className="text-secondary">{playlist.Songs?.length || 0} songs</small>
                </div>
                <div className="card-footer bg-light">
                  <button className="btn btn-sm btn-info me-2" onClick={() => handleViewPlaylist(playlist)}>
                    View
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClick(playlist.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: View Playlist */}
      {showViewModal && selectedPlaylist && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedPlaylist.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                {playlistSongs.length === 0 ? (
                  <p className="text-muted">No songs in this playlist yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Artists</th>
                          <th>Album</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playlistSongs.map((song) => (
                          <tr key={song.id}>
                            <td>{song.title}</td>
                            <td>{song.artists?.join(', ')}</td>
                            <td>{song.album}</td>
                            <td>
                              <div className="d-flex gap-1 flex-wrap">
                                <button
                                  className="btn btn-sm btn-warning"
                                  onClick={() => handlePlayTrack(song)}
                                >
                                  ▶️
                                </button>
                                <button
                                  className={`btn btn-sm ${favoriteSongIds.has(song.id) ? 'btn-danger' : 'btn-success'}`}
                                  onClick={() => handleAddRemoveFavorite(song)}
                                >
                                  {favoriteSongIds.has(song.id) ? '❌ ❤️' : '✅ ❤️'}
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRemoveSongFromPlaylist(song.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus */}
      {showConfirm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this playlist? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;
