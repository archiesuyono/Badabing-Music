import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { musicAPI } from '../../api/endpoints';

// Daftar genre yang mau ditampilin di Home
const GENRES = [
  { name: 'Top Pop Music', query: 'pop hits' },
  { name: 'Trending Music', query: 'trending' },
  { name: 'Rock Music', query: 'rock' },
  { name: 'Hip Hop / Rap', query: 'hip hop' },
  { name: 'Jazz & Soul', query: 'jazz' },
  { name: 'Electronic Music', query: 'electronic' },
  { name: 'Alternative / Indie', query: 'alternative' },
  { name: 'R&B / Soul', query: 'r&b' },
  { name: 'Latin / Reggaeton', query: 'reggaeton' },
  { name: 'Classical / Piano', query: 'classical' },
  { name: 'EDM / Dance', query: 'dance' },
  { name: 'Funk / Disco', query: 'funk' },
  { name: 'Reggae', query: 'reggae' },
  { name: 'K-pop', query: 'k-pop' },
  { name: 'Metal', query: 'metal' },
  { name: 'Acoustic / Folk', query: 'acoustic' },
  { name: '🎵 1970s Hits', query: 'hits from the 70s' },
  { name: '🎵 1980s Hits', query: 'hits from the 80s' },
  { name: '🎵 1990s Hits', query: 'hits from the 90s' },
  { name: '🎵 2000s Hits', query: 'hits from the 2000s' },
  { name: '🎵 2010s Hits', query: 'hits from the 2010s' },
];

// Export biar bisa dipakai di komponen
export { GENRES };

// Fetch semua lagu berdasarkan genre — dipanggil sekali waktu Home load
export const fetchGenreTracks = createAsyncThunk(
  'music/fetchGenreTracks',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch semua genre secara paralel biar cepat
      const results = await Promise.allSettled(
        GENRES.map((genre) => musicAPI.searchByGenre(genre.query, 6))
      );

      const genreData = {};
      results.forEach((result, index) => {
        const genre = GENRES[index];
        if (result.status === 'fulfilled') {
          genreData[genre.query] = {
            displayName: genre.name,
            tracks: result.value.data.data.tracks || [],
          };
        } else {
          // Kalau gagal, kasih array kosong aja jangan crash
          console.error(`Gagal fetch genre ${genre.query}:`, result.reason);
          genreData[genre.query] = {
            displayName: genre.name,
            tracks: [],
          };
        }
      });

      return genreData;
    } catch (err) {
      return rejectWithValue('Gagal memuat data musik');
    }
  }
);

// Fetch hasil search lagu
export const searchTracks = createAsyncThunk(
  'music/search',
  async (query, { rejectWithValue }) => {
    try {
      const response = await musicAPI.search(query);
      return response.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Pencarian gagal');
    }
  }
);

const musicSlice = createSlice({
  name: 'music',
  initialState: {
    genreTracks: {},       // { [query]: { displayName, tracks[] } }
    searchResults: [],     // hasil pencarian
    searchQuery: '',       // query terakhir yang dicari
    loadingGenres: false,
    loadingSearch: false,
    error: null,
  },
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    clearSearch(state) {
      state.searchResults = [];
      state.searchQuery = '';
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- fetchGenreTracks ---
    builder.addCase(fetchGenreTracks.pending, (state) => {
      state.loadingGenres = true;
      state.error = null;
    });
    builder.addCase(fetchGenreTracks.fulfilled, (state, action) => {
      state.loadingGenres = false;
      state.genreTracks = action.payload;
    });
    builder.addCase(fetchGenreTracks.rejected, (state, action) => {
      state.loadingGenres = false;
      state.error = action.payload;
    });

    // --- searchTracks ---
    builder.addCase(searchTracks.pending, (state) => {
      state.loadingSearch = true;
      state.error = null;
    });
    builder.addCase(searchTracks.fulfilled, (state, action) => {
      state.loadingSearch = false;
      state.searchResults = action.payload;
    });
    builder.addCase(searchTracks.rejected, (state, action) => {
      state.loadingSearch = false;
      state.error = action.payload;
    });
  },
});

export const { setSearchQuery, clearSearch, clearError } = musicSlice.actions;
export default musicSlice.reducer;
