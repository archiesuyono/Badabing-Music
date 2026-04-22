const express = require('express');
const authenticateToken = require('../middlewares/authentication');
const playlistController = require('../controllers/playlistController');

const router = express.Router();

// Create playlist
router.post('/', authenticateToken, playlistController.createPlaylist);

// Get all playlists for user
router.get('/', authenticateToken, playlistController.getUserPlaylists);

// Get playlist by id
router.get('/:id', authenticateToken, playlistController.getPlaylistById);

// Generate AI description for playlist
router.post('/:id/generate-description', authenticateToken, playlistController.generatePlaylistDescription);

// Update playlist
router.put('/:id', authenticateToken, playlistController.updatePlaylist);

// Delete playlist
router.delete('/:id', authenticateToken, playlistController.deletePlaylist);

// Add song to playlist
router.post('/:playlistId/songs', authenticateToken, playlistController.addSongToPlaylist);

// Remove song from playlist (by songId or spotifyId)
router.delete('/:playlistId/songs/:songId', authenticateToken, playlistController.removeSongFromPlaylist);

module.exports = router;
