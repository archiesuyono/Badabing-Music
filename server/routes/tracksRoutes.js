const express = require('express');
const authenticateToken = require('../middlewares/authentication');
const musicController = require('../controllers/musicController');

const router = express.Router();

// Search music by keyword
router.get('/search', authenticateToken, musicController.searchMusic);

// Search music by genre (for home page recommendations)
router.get('/genre/:genre', authenticateToken, musicController.searchByGenre);

// Search music by mood
router.post('/mood', authenticateToken, musicController.searchByMood);

// Get song details
router.get('/:id', authenticateToken, musicController.getSongDetails);

// Get lyrics
router.get('/:id/lyrics', authenticateToken, musicController.getSongLyrics);

// Get search history
router.get('/history/user', authenticateToken, musicController.getSearchHistory);

// Generate AI lyrics for a track
router.post('/:id/generate-lyrics', authenticateToken, musicController.generateSongLyrics);

module.exports = router;


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

// Valid moods list
const VALID_MOODS = [
  'sedih', 'senang', 'marah', 'santai', 'romantis', 'energik', 'takut', 'hopeful',
  'happy', 'sad', 'angry', 'calm', 'romantic', 'energetic', 'fear', 'hopeful',
  'melancholic', 'joyful', 'peaceful', 'excited', 'uplifting'
];

// Search music by mood
router.post('/mood', authenticateToken, async (req, res, next) => {
  try {
    const { mood, limit = 20 } = req.body;

    if (!mood || mood.trim().length === 0) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    // Validate if the input is actually a valid mood
    const moodLower = mood.toLowerCase().trim();
    const isValidMood = VALID_MOODS.some(validMood => 
      moodLower.includes(validMood.toLowerCase()) || validMood.toLowerCase().includes(moodLower)
    );

    if (!isValidMood) {
      return res.status(400).json({ 
        error: `"${mood}" is not a valid mood. Please use valid moods like: sedih, senang, marah, santai, romantis, energik, takut, atau hopeful` 
      });
    }

    console.log(`🎵 [MOOD] Search request for mood: "${mood}" (limit: ${limit})`);

    // Save search history
    await SearchHistory.create({
      userId: req.userId,
      query: mood,
      type: 'mood'
    });

    // Search by mood using Gemini AI
    const tracks = await searchMusicByMood(mood, parseInt(limit) || 20);
    console.log(`🎵 [MOOD] Found ${tracks.length} tracks from mood search`);

    // Generate explanations for each track and save to database
    const tracksWithExplanations = await Promise.all(
      tracks.map(async (track) => {
        try {
          // Generate explanation for why this track matches the mood
          const explanation = await generateTrackExplanation(
            track.title,
            track.artists,
            mood,
            track.moodAnalysis
          );

          // Save track to database
          const [song] = await Song.findOrCreate({
            where: { spotifyId: track.spotifyId },
            defaults: track
          });

          console.log(`✅ [MOOD] Saved track: "${song.title}" with ID: ${song.id}`);

          return {
            ...song.toJSON(),
            explanation // Add AI-generated explanation
          };
        } catch (error) {
          console.error(`❌ [MOOD] Error processing track "${track.title}":`, error.message);
          // Still return the track even if explanation generation fails
          return {
            ...track,
            explanation: `Matches your ${mood} mood`
          };
        }
      })
    );

    console.log(`✅ [MOOD] Returning ${tracksWithExplanations.length} tracks with explanations`);

    res.json({
      message: `Search successful for mood: ${mood}`,
      data: {
        mood,
        total: tracksWithExplanations.length,
        tracks: tracksWithExplanations
      }
    });
  } catch (error) {
    console.error(`❌ [MOOD] Error in mood search:`, error);
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

// Generate AI lyrics for a track
router.post('/:id/generate-lyrics', authenticateToken, async (req, res, next) => {
  try {
    const trackId = req.params.id;
    console.log(`🎵 [LYRICS] Request received for track ID: ${trackId}`);

    const song = await Song.findByPk(trackId);

    if (!song) {
      console.error(`❌ [LYRICS] Song not found with ID: ${trackId}`);
      return res.status(404).json({ error: 'Song not found' });
    }

    console.log(`� [LYRICS] Fetching lyrics for: "${song.title}" by ${song.artists.join(', ')}`);

    // Get real lyrics from Genius API
    const lyrics = await getTrackLyrics(song.title, song.artists);

    if (!lyrics) {
      console.error(`❌ [LYRICS] Could not fetch lyrics from Genius for "${song.title}"`);
      return res.status(500).json({ error: 'Lyrics not found for this song' });
    }

    console.log(`✅ [LYRICS] Successfully fetched ${lyrics.length} characters of lyrics for "${song.title}"`);

    res.json({
      message: 'Lyrics fetched successfully',
      data: {
        songId: song.id,
        title: song.title,
        artists: song.artists,
        lyrics: lyrics,
        generated: false,
        source: 'Genius'
      }
    });
  } catch (error) {
    console.error(`❌ [LYRICS] Error:`, error);
    res.status(500).json({ error: 'Failed to fetch lyrics - please try again' });
  }
});

module.exports = router;
