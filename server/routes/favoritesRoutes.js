const express = require('express');
const authenticateToken = require('../middlewares/authentication');
const favoritesController = require('../controllers/favoritesController');

const router = express.Router();

// Add to favorites
router.post('/', authenticateToken, favoritesController.addFavorite);

// Get all favorites
router.get('/', authenticateToken, favoritesController.getFavorites);

// Check if song is favorite (by songId or spotifyId)
router.get('/:songId', authenticateToken, favoritesController.isFavorite);

// Remove from favorites (by songId or spotifyId)
router.delete('/:songId', authenticateToken, favoritesController.removeFavorite);

module.exports = router;


// Add to favorites
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { songId, spotifyId, spotifyUri, title, artists, album, imageUrl, duration, previewUrl, externalUrl } = req.body;

    console.log('📝 [FAVORITE] Add request:', { spotifyId, title });

    if (!songId && !spotifyId) {
      return res.status(400).json({ error: 'Song ID or Spotify ID is required' });
    }

    let song;

    // If spotifyId provided, find or create song
    if (spotifyId) {
      try {
        const songDefaults = {
          spotifyId: String(spotifyId).trim(),
          spotifyUri: spotifyUri ? String(spotifyUri).trim() : null,
          title: title ? String(title).trim() : 'Unknown',
          artists: Array.isArray(artists) ? artists.map(a => String(a).trim()) : (artists ? [String(artists).trim()] : ['Unknown']),
          album: album ? String(album).trim() : 'Unknown',
          imageUrl: imageUrl ? String(imageUrl).trim() : null,
          duration: duration ? parseInt(duration) : 0,
          previewUrl: previewUrl ? String(previewUrl).trim() : null,
          externalUrl: externalUrl ? String(externalUrl).trim() : null
        };

        console.log('📝 [FAVORITE] Song defaults:', { spotifyId: songDefaults.spotifyId, title: songDefaults.title });

        [song] = await Song.findOrCreate({
          where: { spotifyId: songDefaults.spotifyId },
          defaults: songDefaults
        });
        console.log('✅ [FAVORITE] Song found/created:', song.id, song.title);
      } catch (songErr) {
        console.error('❌ [FAVORITE] Error finding/creating song:', songErr.message, songErr.stack);
        return res.status(500).json({ error: `Failed to process song: ${songErr.message}` });
      }
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
      console.log('⚠️ [FAVORITE] Song already in favorites');
      return res.status(400).json({ error: 'Song already in favorites' });
    }

    const favorite = await Favorite.create({
      userId: req.userId,
      songId: song.id
    });

    console.log('✅ [FAVORITE] Added to favorites:', favorite.id);
    res.status(201).json({
      message: 'Song added to favorites',
      data: favorite
    });
  } catch (error) {
    console.error('❌ [FAVORITE] Error:', error.message, error.stack);
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

// Check if song is favorite (by songId or spotifyId)
router.get('/:songId', authenticateToken, async (req, res, next) => {
  try {
    const songIdParam = req.params.songId;
    
    // Simple UUID validation (4 groups of hex digits separated by hyphens)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(songIdParam);
    
    let song = null;
    
    // Try to find by database ID only if it looks like a UUID
    if (isUUID) {
      song = await Song.findByPk(songIdParam);
    }
    
    // If not found by ID, try finding by spotifyId
    if (!song) {
      song = await Song.findOne({ where: { spotifyId: songIdParam } });
    }
    
    if (!song) {
      return res.json({ isFavorite: false });
    }

    const favorite = await Favorite.findOne({
      where: { userId: req.userId, songId: song.id }
    });

    res.json({
      isFavorite: !!favorite
    });
  } catch (error) {
    next(error);
  }
});

// Remove from favorites (by songId or spotifyId)
router.delete('/:songId', authenticateToken, async (req, res, next) => {
  try {
    const songIdParam = req.params.songId;
    
    // Simple UUID validation (4 groups of hex digits separated by hyphens)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(songIdParam);
    
    let song = null;
    
    // Try to find by database ID only if it looks like a UUID
    if (isUUID) {
      song = await Song.findByPk(songIdParam);
    }
    
    // If not found by ID, try finding by spotifyId
    if (!song) {
      song = await Song.findOne({ where: { spotifyId: songIdParam } });
    }
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const result = await Favorite.destroy({
      where: { userId: req.userId, songId: song.id }
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
