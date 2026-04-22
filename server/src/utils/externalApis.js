const SpotifyWebApi = require('spotify-web-api-node');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

const initializeSpotify = async () => {
  try {
    const data = await spotifyApi.clientCredentialsFlow();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('Spotify API initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Spotify API - trying alternative method:', error.message);
    try {
      // Try alternative method for newer versions
      const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
          grant_type: 'client_credentials'
        },
        json: true
      };

      const response = await axios.post(authOptions.url, authOptions.form, {
        headers: authOptions.headers
      });

      spotifyApi.setAccessToken(response.data.access_token);
      console.log('Spotify API initialized with alternative method');
      return true;
    } catch (altError) {
      console.error('Failed to initialize Spotify API (alternative method):', altError.message);
      return false;
    }
  }
};

const searchMusic = async (query, limit = 20) => {
  try {
    const data = await spotifyApi.searchTracks(query, { limit: Math.min(limit, 50) }); // Spotify max 50 per request
    return data.body.tracks.items.map(track => ({
      spotifyId: track.id,
      spotifyUri: track.uri,
      title: track.name,
      artists: track.artists.map(a => a.name),
      album: track.album.name,
      imageUrl: track.album.images[0]?.url,
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      externalUrl: track.external_urls.spotify
    }));
  } catch (error) {
    throw new Error(`Failed to search music: ${error.message}`);
  }
};

const searchMusicByMood = async (mood, limit = 20) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Suggest me 5 music genre or artist keywords that match the mood: "${mood}". 
    Return only the keywords separated by commas, no explanation needed. 
    Example: for "happy" mood, return something like "pop, dance, funk, upbeat, celebration"`;

    const result = await model.generateContent(prompt);
    const keywords = result.response.text().split(',').map(k => k.trim());

    let allTracks = [];
    const tracksPerKeyword = Math.ceil(limit / keywords.length);
    
    for (const keyword of keywords) {
      const data = await spotifyApi.searchTracks(keyword, { limit: Math.min(tracksPerKeyword, 50) });
      allTracks = allTracks.concat(data.body.tracks.items);
    }

    // Remove duplicates and limit to requested amount
    const uniqueTracks = Array.from(
      new Map(allTracks.map(track => [track.id, track])).values()
    ).slice(0, limit);

    return uniqueTracks.map(track => ({
      spotifyId: track.id,
      spotifyUri: track.uri,
      title: track.name,
      artists: track.artists.map(a => a.name),
      album: track.album.name,
      imageUrl: track.album.images[0]?.url,
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      externalUrl: track.external_urls.spotify,
      mood
    }));
  } catch (error) {
    throw new Error(`Failed to search music by mood: ${error.message}`);
  }
};

const getTrackLyrics = async (title, artists) => {
  try {
    const artistName = artists[0] || '';
    const query = `${title} ${artistName}`;
    
    const response = await axios.get('https://api.genius.com/search', {
      params: {
        q: query,
        access_token: process.env.GENIUS_API_KEY
      }
    });

    const hits = response.data.response.hits;
    if (hits.length === 0) {
      return null;
    }

    const song = hits[0].result;
    const lyricsPageUrl = song.url;

    // Fetch lyrics from the song page (Genius doesn't provide direct API for lyrics)
    // You would need to parse the HTML or use a separate lyrics service
    // For now, we return the song URL where user can view lyrics

    return {
      title: song.title,
      artist: song.primary_artist.name,
      url: song.url,
      thumbnail: song.song_art_image_thumbnail_url
    };
  } catch (error) {
    throw new Error(`Failed to get lyrics: ${error.message}`);
  }
};

// Refresh Spotify token periodically
setInterval(initializeSpotify, 55 * 60 * 1000); // Every 55 minutes

module.exports = {
  initializeSpotify,
  searchMusic,
  searchMusicByMood,
  getTrackLyrics,
  spotifyApi
};
