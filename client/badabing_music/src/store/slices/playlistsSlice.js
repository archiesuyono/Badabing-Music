import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { playlistAPI } from '../../api/endpoints';

// Ambil semua playlist dari server
export const fetchPlaylists = createAsyncThunk(
  'playlists/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await playlistAPI.getAll();
      return response.data.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Gagal memuat playlists');
    }
  }
);

// Buat playlist baru
export const createPlaylist = createAsyncThunk(
  'playlists/create',
  async ({ name, description }, { rejectWithValue }) => {
    try {
      const response = await playlistAPI.create(name, description);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Gagal membuat playlist');
    }
  }
);

// Hapus playlist
export const deletePlaylist = createAsyncThunk(
  'playlists/delete',
  async (playlistId, { rejectWithValue }) => {
    try {
      await playlistAPI.delete(playlistId);
      return playlistId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Gagal menghapus playlist');
    }
  }
);

// Tambah lagu ke playlist
export const addSongToPlaylist = createAsyncThunk(
  'playlists/addSong',
  async ({ playlistId, song }, { rejectWithValue }) => {
    try {
      await playlistAPI.addSong(playlistId, song);
      return { playlistId, song };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Gagal menambah lagu');
    }
  }
);

// Hapus lagu dari playlist
export const removeSongFromPlaylist = createAsyncThunk(
  'playlists/removeSong',
  async ({ playlistId, songId }, { rejectWithValue }) => {
    try {
      await playlistAPI.removeSong(playlistId, songId);
      return { playlistId, songId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Gagal menghapus lagu');
    }
  }
);

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState: {
    items: [],        // list semua playlist milik user
    loading: false,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- fetchPlaylists ---
    builder.addCase(fetchPlaylists.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPlaylists.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchPlaylists.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // --- createPlaylist ---
    builder.addCase(createPlaylist.fulfilled, (state, action) => {
      if (action.payload) {
        state.items.push(action.payload);
      }
    });
    builder.addCase(createPlaylist.rejected, (state, action) => {
      state.error = action.payload;
    });

    // --- deletePlaylist ---
    builder.addCase(deletePlaylist.fulfilled, (state, action) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    });
    builder.addCase(deletePlaylist.rejected, (state, action) => {
      state.error = action.payload;
    });

    // --- addSongToPlaylist ---
    builder.addCase(addSongToPlaylist.fulfilled, (state, action) => {
      const { playlistId, song } = action.payload;
      const playlist = state.items.find((p) => p.id === playlistId);
      if (playlist) {
        // Pastikan Songs array ada
        if (!playlist.Songs) playlist.Songs = [];
        const sudahAda = playlist.Songs.some((s) => s.id === song.id);
        if (!sudahAda) {
          playlist.Songs.push(song);
        }
      }
    });

    // --- removeSongFromPlaylist ---
    builder.addCase(removeSongFromPlaylist.fulfilled, (state, action) => {
      const { playlistId, songId } = action.payload;
      const playlist = state.items.find((p) => p.id === playlistId);
      if (playlist && playlist.Songs) {
        playlist.Songs = playlist.Songs.filter((s) => s.id !== songId);
      }
    });
  },
});

export const { clearError } = playlistsSlice.actions;
export default playlistsSlice.reducer;
