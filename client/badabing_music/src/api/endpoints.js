import apiClient from './apiClient';

// Auth endpoints
export const authAPI = {
  register: (email, username, password) =>
    apiClient.post('/auth/register', { email, username, password }),

  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  getProfile: () =>
    apiClient.get('/auth/me'),

  updateProfile: (data) =>
    apiClient.put('/auth/profile', data),

  googleLogin: (token) =>
    apiClient.post('/auth/google', { token })
};

// Music endpoints
export const musicAPI = {
  search: (q, limit = 50) =>
    apiClient.get('/music/search', { params: { q, limit } }),

  searchByMood: (mood, limit = 50) =>
    apiClient.post('/music/mood', { mood, limit }),

  searchByGenre: (genre, limit = 12) =>
    apiClient.get(`/music/genre/${encodeURIComponent(genre)}`, { params: { limit } }),

  getLyrics: (title, artists) =>
    apiClient.get(`/music/${encodeURIComponent(title)}/lyrics`, { params: { artists: artists.join(',') } }),

  getHistory: () =>
    apiClient.get('/music/history/user')
};

// Playlist endpoints
export const playlistAPI = {
  getAll: () =>
    apiClient.get('/playlists'),

  getById: (id) =>
    apiClient.get(`/playlists/${id}`),

  create: (name, description) =>
    apiClient.post('/playlists', { name, description }),

  update: (id, data) =>
    apiClient.put(`/playlists/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/playlists/${id}`),

  addSong: (playlistId, songData) =>
    apiClient.post(`/playlists/${playlistId}/songs`, {
      spotifyId: songData.spotifyId || songData,
      spotifyUri: songData.spotifyUri,
      title: songData.title,
      artists: songData.artists,
      album: songData.album,
      imageUrl: songData.imageUrl,
      duration: songData.duration,
      previewUrl: songData.previewUrl,
      externalUrl: songData.externalUrl
    }),

  removeSong: (playlistId, songId) =>
    apiClient.delete(`/playlists/${playlistId}/songs/${songId}`)
};

// Favorite endpoints
export const favoriteAPI = {
  getAll: () =>
    apiClient.get('/favorites'),

  add: (songData) =>
    apiClient.post('/favorites', {
      spotifyId: songData.spotifyId || songData,
      spotifyUri: songData.spotifyUri,
      title: songData.title,
      artists: songData.artists,
      album: songData.album,
      imageUrl: songData.imageUrl,
      duration: songData.duration,
      previewUrl: songData.previewUrl,
      externalUrl: songData.externalUrl
    }),

  remove: (songId) =>
    apiClient.delete(`/favorites/${songId}`),

  check: (songId) =>
    apiClient.get(`/favorites/${songId}`)
};
