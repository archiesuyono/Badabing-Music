import { configureStore } from '@reduxjs/toolkit';
import favoritesReducer from './slices/favoritesSlice';
import playlistsReducer from './slices/playlistsSlice';
import musicReducer from './slices/musicSlice';

// Ini adalah store utama Redux untuk aplikasi
// Semua data global (favorites, playlists, musik) disimpan di sini
const store = configureStore({
  reducer: {
    favorites: favoritesReducer,   // state.favorites
    playlists: playlistsReducer,   // state.playlists
    music: musicReducer,           // state.music
  },
});

export default store;
