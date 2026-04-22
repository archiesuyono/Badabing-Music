const express = require('express');
const { Song, SearchHistory, User } = require('../models');
const { searchMusic, searchMusicByMood, getTrackLyrics } = require('../utils/externalApis');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// Search music by keyword
router.get('/search', authenticateToken, async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Save search history
    await SearchHistory.create({
      userId: req.userId,
      query: q,
      type: 'keyword'
    });

    // Search from Spotify
    const tracks = await searchMusic(q, parseInt(limit) || 20);

    // Save tracks to database (if not exists)
    const savedTracks = await Promise.all(
      tracks.map(async (track) => {
        const [song] = await Song.findOrCreate({
          where: { spotifyId: track.spotifyId },
          defaults: {
            ...track,
            mood: null
          }
        });
        return song.toJSON();
      })
    );

    res.json({
      message: 'Search successful',
      data: {
        total: savedTracks.length,
        tracks: savedTracks
      }
    });
  } catch (error) {
    next(error);
  }
});

// Search music by genre (for home page recommendations)
router.get('/genre/:genre', authenticateToken, async (req, res, next) => {
  try {
    const { genre } = req.params;
    const { limit = 12 } = req.query;

    if (!genre || genre.trim().length === 0) {
      return res.status(400).json({ error: 'Genre is required' });
    }

    // Search from Spotify
    const tracks = await searchMusic(genre, parseInt(limit) || 12);

    // Save tracks to database (if not exists)
    const savedTracks = await Promise.all(
      tracks.map(async (track) => {
        const [song] = await Song.findOrCreate({
          where: { spotifyId: track.spotifyId },
          defaults: {
            ...track,
            mood: null
          }
        });
        return song.toJSON();
      })
    );

    res.json({
      message: `Tracks for genre: ${genre}`,
      data: {
        genre,
        total: savedTracks.length,
        tracks: savedTracks
      }
    });
  } catch (error) {
    next(error);
  }
});

// Search music by mood
router.post('/mood', authenticateToken, async (req, res, next) => {
  try {
    const { mood, limit = 20 } = req.body;

    if (!mood || mood.trim().length === 0) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    // Save search history
    await SearchHistory.create({
      userId: req.userId,
      query: mood,
      type: 'mood'
    });

    // Search by mood using Gemini AI
    const tracks = await searchMusicByMood(mood, parseInt(limit) || 20);

    // Save tracks to database (if not exists)
    const savedTracks = await Promise.all(
      tracks.map(async (track) => {
        const [song] = await Song.findOrCreate({
          where: { spotifyId: track.spotifyId },
          defaults: track
        });
        return song.toJSON();
      })
    );

    res.json({
      message: `Search successful for mood: ${mood}`,
      data: {
        mood,
        total: savedTracks.length,
        tracks: savedTracks
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get song details
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const song = await Song.findByPk(req.params.id);

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(song);
  } catch (error) {
    next(error);
  }
});

// Get lyrics
router.get('/:id/lyrics', authenticateToken, async (req, res, next) => {
  try {
    const song = await Song.findByPk(req.params.id);

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const lyrics = await getTrackLyrics(song.title, song.artists);

    if (!lyrics) {
      return res.status(404).json({ error: 'Lyrics not found' });
    }

    res.json({
      songId: song.id,
      title: song.title,
      artists: song.artists,
      lyrics
    });
  } catch (error) {
    next(error);
  }
});

// Get search history
router.get('/history/user', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const history = await SearchHistory.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      message: 'Search history retrieved successfully',
      total: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
