const { Playlist, PlaylistSong, Song } = require('../models');
const { generatePlaylistDescription } = require('../helpers/externalApis');

// Create playlist
exports.createPlaylist = async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Playlist name is required' });
    }

    // If no description provided, generate one with AI
    let finalDescription = description;
    if (!description || description.trim().length === 0) {
      console.log(`🤖 Generating AI description for playlist: "${name}"`);
      finalDescription = await generatePlaylistDescription(name, [], [], '');
    }

    const playlist = await Playlist.create({
      userId: req.userId,
      name,
      description: finalDescription || null,
      isPublic: isPublic || false
    });

    res.status(201).json({
      message: 'Playlist created successfully',
      data: playlist
    });
  } catch (error) {
    next(error);
  }
};

// Get all playlists for user
exports.getUserPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.findAll({
      where: { userId: req.userId },
      include: {
        model: Song,
        as: 'Songs',
        through: { attributes: [] }
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      message: 'Playlists retrieved successfully',
      total: playlists.length,
      data: playlists
    });
  } catch (error) {
    next(error);
  }
};

// Get playlist by id
exports.getPlaylistById = async (req, res, next) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id, {
      include: {
        model: Song,
        as: 'Songs',
        through: { attributes: ['addedAt'] }
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check authorization (owner or public)
    if (playlist.userId !== req.userId && !playlist.isPublic) {
      return res.status(403).json({ error: 'You do not have access to this playlist' });
    }

    res.json(playlist);
  } catch (error) {
    next(error);
  }
};

// Generate AI description for playlist
exports.generatePlaylistDescription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mood } = req.body;

    const playlist = await Playlist.findByPk(id, {
      include: {
        model: Song,
        as: 'Songs',
        through: { attributes: [] }
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check authorization
    if (playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'You can only generate descriptions for your own playlists' });
    }

    // Generate description based on songs in playlist
    const trackTitles = playlist.Songs.map(s => s.title);
    const trackArtists = playlist.Songs.map(s => {
      if (Array.isArray(s.artists)) {
        return s.artists[0] || 'Unknown';
      }
      return s.artists || 'Unknown';
    });

    console.log(`🤖 Generating AI description for playlist: "${playlist.name}" with ${trackTitles.length} songs`);
    
    const generatedDescription = await generatePlaylistDescription(
      playlist.name,
      trackTitles,
      trackArtists,
      mood || ''
    );

    // Update playlist with generated description
    playlist.description = generatedDescription;
    await playlist.save();

    res.json({
      message: 'Playlist description generated successfully',
      data: {
        playlistId: playlist.id,
        playlistName: playlist.name,
        generatedDescription,
        updatedAt: playlist.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update playlist
exports.updatePlaylist = async (req, res, next) => {
  try {
    const { name, description, isPublic } = req.body;

    const playlist = await Playlist.findByPk(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check authorization
    if (playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'You can only update your own playlists' });
    }

    if (name) playlist.name = name;
    if (description !== undefined) playlist.description = description;
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    await playlist.save();

    res.json({
      message: 'Playlist updated successfully',
      data: playlist
    });
  } catch (error) {
    next(error);
  }
};

// Delete playlist
exports.deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findByPk(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check authorization
    if (playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own playlists' });
    }

    await playlist.destroy();

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Add song to playlist
exports.addSongToPlaylist = async (req, res, next) => {
  try {
    const { songId, spotifyId, spotifyUri, title, artists, album, imageUrl, duration, previewUrl, externalUrl } = req.body;
    const { playlistId } = req.params;

    console.log('🎵 Add song to playlist request:', { songId, spotifyId, spotifyUri, title });

    if (!songId && !spotifyId) {
      return res.status(400).json({ error: 'Song ID or Spotify ID is required' });
    }

    const playlist = await Playlist.findByPk(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check authorization
    if (playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'You can only add songs to your own playlists' });
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

    // Check if song already in playlist
    const existing = await PlaylistSong.findOne({
      where: { playlistId, songId: song.id }
    });

    if (existing) {
      console.log('🎵 Song already in playlist:', song.id);
      return res.status(400).json({ error: 'Song already in playlist' });
    }

    await playlist.addSong(song);

    console.log('✅ Song added to playlist successfully:', { playlistId, songId: song.id });

    res.status(201).json({
      message: 'Song added to playlist successfully'
    });
  } catch (error) {
    console.error('❌ Error adding song to playlist:', error);
    next(error);
  }
};

// Remove song from playlist (by songId or spotifyId)
exports.removeSongFromPlaylist = async (req, res, next) => {
  try {
    const { playlistId, songId } = req.params;

    const playlist = await Playlist.findByPk(playlistId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check authorization
    if (playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'You can only modify your own playlists' });
    }

    // Try to find by spotifyId first (safer - doesn't require UUID validation)
    let song = await Song.findOne({ where: { spotifyId: songId } });
    
    // If not found by spotifyId, try finding by database ID (UUID) with validation
    if (!song) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(songId);
      if (isUUID) {
        song = await Song.findByPk(songId);
      }
    }

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    await playlist.removeSong(song);

    res.json({ message: 'Song removed from playlist successfully' });
  } catch (error) {
    next(error);
  }
};
