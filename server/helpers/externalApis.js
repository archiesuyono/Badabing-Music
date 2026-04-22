const SpotifyWebApi = require('spotify-web-api-node');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

let spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

const initializeSpotify = async () => {
  try {
    console.log('🔐 Initializing Spotify API...');
    
    // Use axios directly for better control
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

    const response = await axios.post(authOptions.url, new URLSearchParams(authOptions.form), {
      headers: authOptions.headers
    });

    spotifyApi.setAccessToken(response.data.access_token);
    console.log('✅ Spotify API initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Spotify API:', error.message);
    return false;
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

const analyzeLyricMood = async (title, artists, lyrics) => {
  try {
    if (!lyrics) return null;
    
    // Ensure artists is an array
    const artistsArray = Array.isArray(artists) ? artists : (typeof artists === 'string' ? artists.split(',').map(a => a.trim()) : [artists]);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `You are an expert music emotion analyst. Analyze the following song lyrics and determine the mood/emotion expressed.

Song: "${title}" by ${artistsArray.join(', ')}

LYRICS:
${lyrics}

Return ONLY a JSON object (no markdown):
{
  "primary_mood": "one of: sedih, senang, marah, santai, romantis, energik, takut, hopeful",
  "mood_scores": {
    "sedih": 0.0-1.0,
    "senang": 0.0-1.0,
    "marah": 0.0-1.0,
    "santai": 0.0-1.0,
    "romantis": 0.0-1.0,
    "energik": 0.0-1.0,
    "takut": 0.0-1.0,
    "hopeful": 0.0-1.0
  },
  "reasoning": "brief explanation"
}

Be precise and honest in your analysis.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error(`⚠️ Error analyzing lyrics for "${title}":`, error.message);
    return null;
  }
};

const getMoodScore = (userMood, trackMoodAnalysis) => {
  if (!trackMoodAnalysis || !trackMoodAnalysis.mood_scores) return 0;
  
  const moodMap = {
    sedih: ['sedih', 'hopeful'],
    senang: ['senang', 'energik'],
    marah: ['marah', 'energik'],
    santai: ['santai', 'romantis'],
    romantis: ['romantis', 'senang'],
    energik: ['energik', 'senang'],
    bahagia: ['senang', 'energik'],
    chill: ['santai', 'senang']
  };

  const targetMoods = moodMap[userMood.toLowerCase()] || [userMood.toLowerCase()];
  let score = 0;
  
  for (const mood of targetMoods) {
    score += trackMoodAnalysis.mood_scores[mood] || 0;
  }
  
  return score / targetMoods.length;
};

const searchMusicByMood = async (mood, limit = 20) => {
  try {
    console.log(`🎵 Searching mood: ${mood}`);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `You suggest keywords for music search matching this mood: "${mood}".
Return ONLY comma-separated keywords (no JSON, no explanation):`;

    const result = await model.generateContent(prompt);
    const keywords = result.response.text().split(',').map(k => k.trim()).filter(k => k);
    
    console.log(`🔑 Keywords: ${keywords.join(', ')}`);

    let allTracks = [];
    
    // Search dengan keywords
    for (const keyword of keywords.slice(0, 5)) {
      try {
        const data = await spotifyApi.searchTracks(keyword, { limit: 20 });
        allTracks = allTracks.concat(data.body.tracks.items);
      } catch (searchError) {
        console.warn(`⚠️ Search failed for "${keyword}":`, searchError.message);
      }
    }

    console.log(`📊 Analyzing ${allTracks.length} tracks for mood: ${mood}...`);
    
    // Analyze setiap track
    const tracksWithMood = [];
    
    for (const track of allTracks) {
      try {
        // Ambil lyrics
        const artistNames = track.artists.map(a => a.name);
        const lyrics = await getTrackLyrics(track.name, artistNames);
        
        if (lyrics && lyrics.url) {
          console.log(`  📝 Analyzing "${track.name}"`);
          
          // Analyze mood dari lyrics
          const moodAnalysis = await analyzeLyricMood(
            track.name,
            artistNames,
            lyrics.url // Genius returns URL, not actual lyrics
          );
          
          if (moodAnalysis) {
            const matchScore = getMoodScore(mood, moodAnalysis);
            tracksWithMood.push({
              track,
              moodAnalysis,
              matchScore
            });
            console.log(`    ✅ Match score: ${(matchScore * 100).toFixed(1)}%`);
          }
        } else {
          // Fallback: jika no lyrics, masukkan dengan score default
          console.log(`  ⚠️ No lyrics found for "${track.name}", adding with default score`);
          tracksWithMood.push({
            track,
            moodAnalysis: null,
            matchScore: 0.5
          });
        }
      } catch (analyzeError) {
        console.warn(`⚠️ Error analyzing track:`, analyzeError.message);
        // Tetap include track
        tracksWithMood.push({
          track,
          moodAnalysis: null,
          matchScore: 0.5
        });
      }
    }

    // Sort by match score dan remove duplicates
    const topTracks = tracksWithMood
      .sort((a, b) => b.matchScore - a.matchScore)
      .filter((item, index, self) => 
        index === self.findIndex((t) => t.track.id === item.track.id)
      )
      .slice(0, limit);

    console.log(`✅ Found ${topTracks.length} tracks matching mood: ${mood}`);

    return topTracks.map(item => ({
      spotifyId: item.track.id,
      spotifyUri: item.track.uri,
      title: item.track.name,
      artists: item.track.artists.map(a => a.name),
      album: item.track.album.name,
      imageUrl: item.track.album.images[0]?.url,
      duration: item.track.duration_ms,
      previewUrl: item.track.preview_url,
      externalUrl: item.track.external_urls.spotify,
      mood,
      moodAnalysis: item.moodAnalysis,
      matchScore: item.matchScore
    }));
  } catch (error) {
    console.error(`❌ Mood search error:`, error.message);
    
    // Fallback: direct search
    try {
      console.log(`🔄 Fallback: searching for "${mood}" directly`);
      const data = await spotifyApi.searchTracks(mood, { limit });
      return data.body.tracks.items.map(track => ({
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
    } catch (fallbackError) {
      console.error(`❌ Fallback search failed:`, fallbackError.message);
      throw new Error(`Failed to search music by mood: ${error.message}`);
    }
  }
};

const getTrackLyrics = async (title, artists) => {
  try {
    const artistName = artists && artists.length > 0 ? (Array.isArray(artists) ? artists[0] : artists) : '';
    const query = `${title} ${artistName}`;
    
    console.log(`🎵 [GENIUS] Searching for lyrics: "${query}"`);
    
    const response = await axios.get('https://api.genius.com/search', {
      params: {
        q: query,
        access_token: process.env.GENIUS_API_KEY
      }
    });

    const hits = response.data.response.hits;
    if (hits.length === 0) {
      console.warn(`⚠️ [GENIUS] No lyrics found for "${query}"`);
      return null;
    }

    // Filter hits to find the best match
    // Prioritize matches where title or artist matches
    let bestMatch = hits[0];
    const titleLower = title.toLowerCase().replace(/[^\w\s]/g, '');
    const artistLower = artistName.toLowerCase();
    
    for (const hit of hits) {
      const hitTitle = hit.result.title.toLowerCase().replace(/[^\w\s]/g, '');
      const hitArtist = hit.result.primary_artist.name.toLowerCase();
      
      // Check if both title and artist match
      if (hitTitle.includes(titleLower) && hitArtist.includes(artistLower)) {
        bestMatch = hit;
        console.log(`✅ [GENIUS] Found exact match: "${hit.result.title}"`);
        break;
      }
      // Check if title matches
      if (hitTitle === titleLower) {
        bestMatch = hit;
        console.log(`✅ [GENIUS] Found title match: "${hit.result.title}"`);
      }
    }

    const song = bestMatch.result;
    const lyricsPageUrl = song.url;
    
    console.log(`✅ [GENIUS] Selected song: "${song.title}" by ${song.primary_artist.name}`);
    console.log(`🔗 [GENIUS] Lyrics URL: ${lyricsPageUrl}`);

    // Try to fetch and parse lyrics from the URL using cheerio
    try {
      const lyricsResponse = await axios.get(lyricsPageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const { load } = require('cheerio');
      const $ = load(lyricsResponse.data);
      
      // Genius lyrics are in divs with data-lyrics-container="true"
      let lyrics = '';
      $('[data-lyrics-container="true"]').each((i, elem) => {
        lyrics += $(elem).text();
        lyrics += '\n\n';
      });
      
      if (lyrics && lyrics.trim().length > 0) {
        console.log(`📖 [GENIUS] Successfully parsed ${lyrics.length} characters of lyrics`);
        return lyrics.trim();
      } else {
        console.warn(`⚠️ [GENIUS] Could not parse lyrics from page, trying alternative selector`);
        
        // Try alternative selector for older Genius page format
        lyrics = '';
        $('div[class*="Lyrics__Container"]').each((i, elem) => {
          lyrics += $(elem).text();
          lyrics += '\n\n';
        });
        
        if (lyrics && lyrics.trim().length > 0) {
          console.log(`📖 [GENIUS] Successfully parsed ${lyrics.length} characters using alternative selector`);
          return lyrics.trim();
        }
        
        return null;
      }
    } catch (parseError) {
      console.warn(`⚠️ [GENIUS] Failed to parse lyrics from Genius page:`, parseError.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ [GENIUS] Error getting lyrics:`, error.message);
    return null;
  }
};

const generatePlaylistDescription = async (playlistName, trackTitles, trackArtists, playlistMood = '') => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const tracksInfo = trackTitles.map((title, idx) => `${idx + 1}. "${title}" by ${trackArtists[idx]}`).join('\n');

    const prompt = `You are a creative music curator. Generate a short, catchy and engaging description for a playlist.

Playlist Name: "${playlistName}"
${playlistMood ? `Mood/Theme: ${playlistMood}` : ''}

Tracks in playlist:
${tracksInfo}

Create a description that:
- Is 2-3 sentences max
- Highlights the vibe/emotion of the playlist
- Is engaging and inviting
- Makes listeners want to play it

Return ONLY the description text, no quotes, no explanations.`;

    const result = await model.generateContent(prompt);
    const description = result.response.text().trim();
    
    console.log(`✨ Generated playlist description for "${playlistName}"`);
    return description;
  } catch (error) {
    console.error(`⚠️ Error generating playlist description:`, error.message);
    return `A curated collection of tracks`;
  }
};

const generateTrackExplanation = async (trackTitle, artists, mood, moodAnalysis) => {
  try {
    console.log(`💡 [GEMINI] Generating explanation for "${trackTitle}"`);
    
    // Ensure artists is an array
    const artistsArray = Array.isArray(artists) ? artists : (typeof artists === 'string' ? artists.split(',').map(a => a.trim()) : [artists]);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const moodContext = moodAnalysis ? 
      `\nAnalyzed mood scores: ${Object.entries(moodAnalysis.mood_scores)
        .map(([m, score]) => `${m}: ${(score * 100).toFixed(0)}%`)
        .join(', ')}` : '';

    const prompt = `You are a music expert. Explain why this track matches the requested mood in a short, friendly way.

Track: "${trackTitle}" by ${artistsArray.join(', ')}
Requested Mood: ${mood}${moodContext}

Provide a 1-sentence explanation (max 15 words) that tells why this song matches the mood.
Be conversational and engaging.

Return ONLY the explanation, no quotes, no other text.`;

    console.log(`💡 [GEMINI] Sending explanation request to Gemini API...`);
    const result = await model.generateContent(prompt);
    const explanation = result.response.text().trim();
    
    console.log(`✅ [GEMINI] Generated explanation for "${trackTitle}"`);
    return explanation;
  } catch (error) {
    console.error(`⚠️ [GEMINI] Error generating track explanation:`, error.message);
    return `Matches your ${mood} mood`;
  }
};

const generateLyricsWithAI = async (trackTitle, artists) => {
  try {
    console.log(`🎵 [GEMINI] Initializing Gemini API for lyrics generation...`);
    
    // Ensure artists is an array
    const artistsArray = Array.isArray(artists) ? artists : (typeof artists === 'string' ? artists.split(',').map(a => a.trim()) : [artists]);
    console.log(`🎵 [GEMINI] Track: "${trackTitle}" by ${artistsArray.join(', ')}`);
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const prompt = `You are a creative songwriter. Generate realistic and poetic lyrics for the following song:

Song Title: "${trackTitle}"
Artists: ${artistsArray.join(', ')}

Create a complete song with 3-4 verses and a chorus. The lyrics should be:
- Original and creative
- Match the vibe suggested by the song title
- Well-structured with clear verses and chorus
- Poetic and engaging

Format the output clearly with [Verse 1], [Chorus], [Verse 2], etc.

Return ONLY the lyrics, no additional explanation.`;

    console.log(`🎵 [GEMINI] Sending prompt to Gemini API...`);
    const result = await model.generateContent(prompt);
    
    if (!result || !result.response) {
      console.error(`❌ [GEMINI] No response from Gemini API`);
      return null;
    }

    const lyrics = result.response.text().trim();
    
    if (!lyrics) {
      console.error(`❌ [GEMINI] Gemini returned empty lyrics`);
      return null;
    }
    
    console.log(`✅ [GEMINI] Successfully generated ${lyrics.length} characters of lyrics for "${trackTitle}"`);
    return lyrics;
  } catch (error) {
    console.error(`❌ [GEMINI] Error generating lyrics:`, error);
    console.error(`❌ [GEMINI] Error message:`, error.message);
    console.error(`❌ [GEMINI] Error stack:`, error.stack);
    return null;
  }
};

// Refresh Spotify token periodically
setInterval(initializeSpotify, 55 * 60 * 1000); // Every 55 minutes

module.exports = {
  initializeSpotify,
  searchMusic,
  searchMusicByMood,
  getTrackLyrics,
  generatePlaylistDescription,
  generateTrackExplanation,
  generateLyricsWithAI,
  spotifyApi
};
