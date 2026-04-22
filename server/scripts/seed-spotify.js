require('dotenv').config();
const { Song } = require('../src/models');
const { spotifyApi, initializeSpotify } = require('../src/utils/externalApis');

const seedData = async () => {
  try {
    console.log('Initializing Spotify API...');
    await initializeSpotify();

    const queries = [
      'happy pop',
      'sad songs',
      'energetic dance',
      'chill lofi',
      'romantic ballads'
    ];

    let seedCount = 0;

    for (const query of queries) {
      console.log(`Searching for: ${query}`);
      const data = await spotifyApi.searchTracks(query, { limit: 10 });

      for (const track of data.body.tracks.items) {
        try {
          const [song, created] = await Song.findOrCreate({
            where: { spotifyId: track.id },
            defaults: {
              title: track.name,
              artists: track.artists.map(a => a.name),
              album: track.album.name,
              imageUrl: track.album.images[0]?.url,
              duration: track.duration_ms,
              previewUrl: track.preview_url,
              externalUrl: track.external_urls.spotify,
              mood: null
            }
          });

          if (created) {
            seedCount++;
            console.log(`✓ Added: ${track.name} by ${track.artists[0].name}`);
          }
        } catch (error) {
          console.error(`Error adding song: ${error.message}`);
        }
      }
    }

    console.log(`\n✓ Seeding complete! ${seedCount} new songs added.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
