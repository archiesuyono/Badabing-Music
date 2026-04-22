const MOODS = [
  'happy',
  'sad',
  'energetic',
  'calm',
  'romantic',
  'aggressive',
  'melancholic',
  'uplifting',
  'relaxed',
  'party',
  'focus',
  'motivational'
];

const SPOTIFY_LIMITS = {
  SEARCH_LIMIT: 20,
  TRACK_LIMIT: 50,
  BATCH_SIZE: 10
};

const JWT_EXPIRATION = {
  ACCESS_TOKEN: '7d',
  REFRESH_TOKEN: '30d'
};

const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Email tidak valid',
  INVALID_PASSWORD: 'Password minimal 6 karakter',
  INVALID_USERNAME: 'Username harus 3-20 karakter, alfanumerik dan underscore saja',
  EMAIL_EXISTS: 'Email sudah terdaftar',
  USERNAME_EXISTS: 'Username sudah digunakan',
  USER_NOT_FOUND: 'User tidak ditemukan',
  INVALID_CREDENTIALS: 'Email atau password salah',
  UNAUTHORIZED: 'Tidak ada akses, login diperlukan',
  FORBIDDEN: 'Anda tidak memiliki izin untuk mengakses resource ini',
  INVALID_TOKEN: 'Token tidak valid atau sudah expired',
  SONG_NOT_FOUND: 'Lagu tidak ditemukan',
  PLAYLIST_NOT_FOUND: 'Playlist tidak ditemukan',
  PLAYLIST_EXISTS: 'Lagu sudah ada di playlist ini'
};

const SEARCH_TYPES = {
  KEYWORD: 'keyword',
  MOOD: 'mood'
};

module.exports = {
  MOODS,
  SPOTIFY_LIMITS,
  JWT_EXPIRATION,
  ERROR_MESSAGES,
  SEARCH_TYPES
};
