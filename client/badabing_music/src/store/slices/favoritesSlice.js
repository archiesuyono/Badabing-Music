import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { favoriteAPI } from '../../api/endpoints';

// Ambil semua favorites dari server
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await favoriteAPI.getAll();
      return response.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Gagal memuat favorites');
    }
  }
);

// Tambah lagu ke favorites
export const addFavorite = createAsyncThunk(
  'favorites/add',
  async (track, { rejectWithValue }) => {
    try {
      await favoriteAPI.add(track);
      return track;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Gagal menambah favorite');
    }
  }
);

// Hapus lagu dari favorites
export const removeFavorite = createAsyncThunk(
  'favorites/remove',
  async (songId, { rejectWithValue }) => {
    try {
      await favoriteAPI.remove(songId);
      return songId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Gagal menghapus favorite');
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: [],         // list lagu yang difavoritkan
    loading: false,
    error: null,
  },
  reducers: {
    // reset error kalau mau
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- fetchFavorites ---
    builder.addCase(fetchFavorites.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFavorites.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchFavorites.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // --- addFavorite ---
    builder.addCase(addFavorite.fulfilled, (state, action) => {
      // Cek dulu biar gak dobel
      const sudahAda = state.items.some((s) => s.id === action.payload.id);
      if (!sudahAda) {
        state.items.push(action.payload);
      }
    });
    builder.addCase(addFavorite.rejected, (state, action) => {
      state.error = action.payload;
    });

    // --- removeFavorite ---
    builder.addCase(removeFavorite.fulfilled, (state, action) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
    });
    builder.addCase(removeFavorite.rejected, (state, action) => {
      state.error = action.payload;
    });
  },
});

export const { clearError } = favoritesSlice.actions;
export default favoritesSlice.reducer;