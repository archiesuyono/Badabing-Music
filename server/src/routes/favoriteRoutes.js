const express = require('express');
const { Favorite, Song } = require('../models');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// Add to favorites
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { songId, spotifyId, spotifyUri, title, artists, album, imageUrl, duration, previewUrl, externalUrl } = req.body;

    if (!songId && !spotifyId) {
      return res.status(400).json({ error: 'Song ID or Spotify ID is required' });
    }

    let song;

    // If spotifyId provided, find or create song
    if (spotifyId) {
      [song] = await Song.findOrCreate({
        where: { spotifyId },
        defaults: {
          spotifyId,
          spotifyUri: spotifyUri || null,
          title: title || 'Unknown',
          artists: artists || ['Unknown'],
          album: album || 'Unknown',
          imageUrl: imageUrl || null,
          duration: duration || 0,
          previewUrl: previewUrl || null,
          externalUrl: externalUrl || null
        }
      });
    } else {
      song = await Song.findByPk(songId);
    }

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Check if already in favorites
    const existing = await Favorite.findOne({
      where: { userId: req.userId, songId: song.id }
    });

    if (existing) {
      return res.status(400).json({ error: 'Song already in favorites' });
    }

    const favorite = await Favorite.create({
      userId: req.userId,
      songId: song.id
    });

    res.status(201).json({
      message: 'Song added to favorites',
      data: favorite
    });
  } catch (error) {
    next(error);
  }
});

// Get all favorites
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const favorites = await Favorite.findAll({
      where: { userId: req.userId },
      include: {
        model: Song,
        attributes: { exclude: [] }
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Favorite.count({
      where: { userId: req.userId }
    });

    res.json({
      message: 'Favorites retrieved successfully',
      total,
      data: favorites.map(fav => fav.Song)
    });
  } catch (error) {
    next(error);
  }
});

// Check if song is favorite
router.get('/:songId', authenticateToken, async (req, res, next) => {
  try {
    const favorite = await Favorite.findOne({
      where: { userId: req.userId, songId: req.params.songId }
    });

    res.json({
      isFavorite: !!favorite
    });
  } catch (error) {
    next(error);
  }
});

// Remove from favorites
router.delete('/:songId', authenticateToken, async (req, res, next) => {
  try {
    const result = await Favorite.destroy({
      where: { userId: req.userId, songId: req.params.songId }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Song removed from favorites' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
