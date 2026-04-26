import { useState, useEffect, useRef } from 'react';
import { musicAPI, playlistAPI, favoriteAPI } from '../api/endpoints';
import { useYouTubePlayer } from '../context/YouTubePlayerContext';

export const Search = () => {
  const { playTrack } = useYouTubePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [mood, setMood] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('keyword');
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [playlistName, setPlaylistName] = useState('');
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const [favoriteSongs, setFavoriteSongs] = useState(new Set());
  const [playlistsWithSongs, setPlaylistsWithSongs] = useState(new Map());
  const searchTimeoutRef = useRef(null);
  const moodTimeoutRef = useRef(null);

  // Valid moods list untuk client-side validation
  const VALID_MOODS = [
    'happy', 'sad', 'energetic', 'chill', 'romantic', 'aggressive',
    'melancholic', 'peaceful', 'upbeat', 'relaxed', 'intense', 'calm',
    'excited', 'mellow', 'dark', 'light', 'moody', 'vibrant',
    'dreamy', 'danceable', 'motivational', 'soothing', 'angry', 'joyful',
    'melancholy', 'playful', 'mysterious', 'epic', 'cozy', 'party',
    'introspective', 'reflective', 'tender', 'wild', 'groovy', 'funky'
  ];

  useEffect(() => {
    fetchFavoritesAndPlaylists();
  }, []);

  // Real-time keyword search
  useEffect(() => {
    if (searchType === 'keyword') {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Jika search query kosong, clear results
      if (!searchQuery.trim()) {
        setResults([]);
        setError('');
        return;
      }

      // Set loading dan clear error
      setLoading(true);
      setError('');

      // Delay API call untuk menghindari terlalu banyak request
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await musicAPI.search(searchQuery);
          setResults(response.data.data.tracks || []);
          console.log('✅ Search results:', response.data.data.tracks?.length || 0);
        } catch (err) {
          setError('Search failed');
          setResults([]);
          console.error('❌ Search error:', err);
        } finally {
          setLoading(false);
        }
      }, 500); // Delay 500ms setelah user berhenti mengetik
    }
  }, [searchQuery, searchType]);

  // Real-time mood search
  useEffect(() => {
    if (searchType === 'mood') {
      // Clear previous timeout
      if (moodTimeoutRef.current) {
        clearTimeout(moodTimeoutRef.current);
      }

      // Jika mood kosong, clear results
      if (!mood.trim()) {
        setResults([]);
        setError('');
        return;
      }

      // Validasi dengan VALID_MOODS list - harus exact match (kata lengkap)
      const isValidMood = VALID_MOODS.some(validMood => 
        validMood.toLowerCase() === mood.toLowerCase()
      );

      // Jika input bukan mood yang valid, jangan trigger API
      if (!isValidMood) {
        setResults([]);
        setError('');
        setLoading(false);
        return;
      }

      // Set loading dan clear error
      setLoading(true);
      setError('');

      // Delay API call untuk menghindari terlalu banyak request
      moodTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await musicAPI.searchByMood(mood);
          setResults(response.data.data.tracks || []);
          console.log('✅ Mood search results:', response.data.data.tracks?.length || 0);
        } catch (err) {
          const errorMessage = err.response?.data?.error || 'Mood search failed';
          setError(errorMessage);
          setResults([]);
          console.error('❌ Mood search error:', err);
        } finally {
          setLoading(false);
        }
      }, 500); // Delay 500ms setelah user berhenti mengetik
    }
  }, [mood, searchType]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (moodTimeoutRef.current) clearTimeout(moodTimeoutRef.current);
    };
  }, []);

  const fetchFavoritesAndPlaylists = async () => {
    try {
      // Fetch favorites
      const favResponse = await favoriteAPI.getAll();
      const favSet = new Set();
      (favResponse.data.data || []).forEach(fav => {
        favSet.add(fav.id);
      });
      setFavoriteSongs(favSet);

      // Fetch playlists
      const playResponse = await playlistAPI.getAll();
      const playlistsList = playResponse.data.data || [];
      setPlaylists(playlistsList);

      // Check which playlists contain each result
      const playlistMap = new Map();
      for (const playlist of playlistsList) {
        const songs = playlist.Songs || [];
        for (const song of songs) {
          if (!playlistMap.has(song.id)) {
            playlistMap.set(song.id, []);
          }
          playlistMap.get(song.id).push(playlist.id);
        }
      }
      setPlaylistsWithSongs(playlistMap);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast({ ...toast, visible: false });
    }, 3000);
  };

  const handlePlayTrack = (track) => {
    // Use global YouTube player
    playTrack(track, results);
  };

  const handleAddToFavorite = async (track) => {
    try {
      if (favoriteSongs.has(track.id)) {
        // Remove from favorites
        await favoriteAPI.remove(track.id);
        const newSet = new Set(favoriteSongs);
        newSet.delete(track.id);
        setFavoriteSongs(newSet);
        showToast('❌ Removed from favorites', 'success');
      } else {
        // Add to favorites
        await favoriteAPI.add(track);
        const newSet = new Set(favoriteSongs);
        newSet.add(track.id);
        setFavoriteSongs(newSet);
        showToast('✅ Added to favorites!', 'success');
      }
    } catch (err) {
      showToast('Failed to update favorite', 'error');
      console.error(err);
    }
  };

  const handleAddRemovePlaylist = async (track, playlistId) => {
    try {
      const trackPlaylistIds = playlistsWithSongs.get(track.id) || [];
      
      if (trackPlaylistIds.includes(playlistId)) {
        // Remove from playlist
        await playlistAPI.removeSong(playlistId, track.id);
        const newMap = new Map(playlistsWithSongs);
        const updatedIds = newMap.get(track.id).filter(id => id !== playlistId);
        newMap.set(track.id, updatedIds);
        setPlaylistsWithSongs(newMap);
        showToast('❌ Removed from playlist', 'success');
      } else {
        // Add to playlist
        await playlistAPI.addSong(playlistId, track);
        const newMap = new Map(playlistsWithSongs);
        const currentIds = newMap.get(track.id) || [];
        currentIds.push(playlistId);
        newMap.set(track.id, currentIds);
        setPlaylistsWithSongs(newMap);
        showToast('✅ Added to playlist!', 'success');
      }
    } catch (err) {
      showToast('Failed to update playlist', 'error');
      console.error(err);
    }
  };

  const handleShowPlaylistModal = async (track) => {
    setSelectedSong(track);
    try {
      const response = await playlistAPI.getAll();
      setPlaylists(response.data.data || []);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    }
    setShowPlaylistModal(true);
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!selectedSong) return;
    try {
      await playlistAPI.addSong(playlistId, selectedSong);
      showToast(`Added to playlist!`, 'success');
      setShowPlaylistModal(false);
      setSelectedSong(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add to playlist';
      showToast(errorMsg, 'error');
      console.error(err);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!playlistName.trim() || !selectedSong) return;
    try {
      const response = await playlistAPI.create(playlistName, '');
      await playlistAPI.addSong(response.data.data.id, selectedSong);
      showToast(`Created playlist and added song!`, 'success');
      setPlaylistName('');
      setShowPlaylistModal(false);
      setSelectedSong(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create playlist';
      showToast(errorMsg, 'error');
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Search Music</h2>

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed`} 
             role="alert"
             style={{
               top: '80px',
               right: '20px',
               zIndex: 9999,
               minWidth: '300px'
             }}>
          {toast.message}
          <button type="button" className="btn-close" onClick={() => setToast({ ...toast, visible: false })}></button>
        </div>
      )}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${searchType === 'keyword' ? 'active' : ''}`}
            onClick={() => {
              setSearchType('keyword');
              setMood('');
              setResults([]);
              setError('');
            }}
            style={{
              color: searchType === 'keyword' ? '#fff' : 'rgba(255,255,255,0.7)',
              borderBottom: searchType === 'keyword' ? '3px solid #fff' : 'none',
              backgroundColor: 'transparent',
              fontSize: '14px'
            }}
          >
            Keyword Search
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${searchType === 'mood' ? 'active' : ''}`}
            onClick={() => {
              setSearchType('mood');
              setSearchQuery('');
              setResults([]);
              setError('');
            }}
            style={{
              color: searchType === 'mood' ? '#fff' : 'rgba(255,255,255,0.7)',
              borderBottom: searchType === 'mood' ? '3px solid #fff' : 'none',
              backgroundColor: 'transparent',
              fontSize: '14px'
            }}
          >
            Mood Search (AI)
          </button>
        </li>
      </ul>

      {searchType === 'keyword' ? (
        <div className="mb-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search songs, artists, albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {loading && <small className="text-muted ms-2 mt-2 d-block">Searching...</small>}
        </div>
      ) : (
        <div className="mb-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Describe your mood (e.g., happy, sad, energetic, chill)..."
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              autoFocus
            />
            {mood && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setMood('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {loading && <small className="text-muted ms-2 mt-2 d-block">Finding songs...</small>}
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {(searchQuery || mood) && results.length === 0 && !loading && !error && (
        <div className="alert alert-info text-center">
          No songs found for "{searchType === 'keyword' ? searchQuery : mood}"
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h4 className="mb-3">Results ({results.length})</h4>
          <div className="row">
            {results.map((track) => (
              <div key={track.id || track.spotifyId} className="col-md-6 col-lg-4 col-xl-2 mb-4">
                <div 
                  style={{
                    backgroundColor: '#282828',
                    padding: '12px',
                    borderRadius: '8px',
                    transition: 'transform 0.3s, background-color 0.3s',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                  onClick={() => handlePlayTrack(track)}
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
      )}

      {/* Playlist Modal */}
      {showPlaylistModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add to Playlist</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPlaylistModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <h6 className="mb-3">Select a playlist:</h6>
                <div className="list-group mb-3">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      type="button"
                      className="list-group-item list-group-item-action"
                      onClick={() => handleAddToPlaylist(playlist.id)}
                    >
                      {playlist.name}
                    </button>
                  ))}
                </div>

                <hr />

                <h6 className="mb-2">Or create new playlist:</h6>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Playlist name"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateNewPlaylist}
                  >
                    Create & Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
