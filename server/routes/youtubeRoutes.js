const express = require('express');
const youtubeController = require('../controllers/youtubeController');

const router = express.Router();

// Search YouTube
router.get('/search/:query', youtubeController.searchYouTube);

module.exports = router;


// Search YouTube
router.get('/search/:query', async (req, res, next) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Search YouTube
    const results = await search(query);

    if (results && results.videos && results.videos.length > 0) {
      const video = results.videos[0];
      res.json({
        success: true,
        data: {
          videoId: video.videoId,
          title: video.title,
          channel: video.author.name,
          duration: video.duration,
          url: video.url
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No video found'
      });
    }
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search YouTube'
    });
  }
});

module.exports = router;
