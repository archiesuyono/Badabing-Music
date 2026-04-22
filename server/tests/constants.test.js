const {
  MOODS,
  SPOTIFY_LIMITS,
  JWT_EXPIRATION,
  ERROR_MESSAGES,
  SEARCH_TYPES
} = require('../src/constants');

describe('Constants', () => {
  describe('MOODS', () => {
    it('should have a list of mood types', () => {
      expect(Array.isArray(MOODS)).toBe(true);
      expect(MOODS.length).toBeGreaterThan(0);
    });

    it('should include specific mood values', () => {
      expect(MOODS).toContain('happy');
      expect(MOODS).toContain('sad');
      expect(MOODS).toContain('energetic');
      expect(MOODS).toContain('calm');
      expect(MOODS).toContain('romantic');
    });

    it('should have exactly 12 moods', () => {
      expect(MOODS.length).toBe(12);
    });
  });

  describe('SPOTIFY_LIMITS', () => {
    it('should define search limit', () => {
      expect(SPOTIFY_LIMITS.SEARCH_LIMIT).toBe(20);
    });

    it('should define track limit', () => {
      expect(SPOTIFY_LIMITS.TRACK_LIMIT).toBe(50);
    });

    it('should define batch size', () => {
      expect(SPOTIFY_LIMITS.BATCH_SIZE).toBe(10);
    });

    it('should have all limit properties', () => {
      expect(SPOTIFY_LIMITS).toHaveProperty('SEARCH_LIMIT');
      expect(SPOTIFY_LIMITS).toHaveProperty('TRACK_LIMIT');
      expect(SPOTIFY_LIMITS).toHaveProperty('BATCH_SIZE');
    });
  });

  describe('JWT_EXPIRATION', () => {
    it('should define access token expiration', () => {
      expect(JWT_EXPIRATION.ACCESS_TOKEN).toBe('7d');
    });

    it('should define refresh token expiration', () => {
      expect(JWT_EXPIRATION.REFRESH_TOKEN).toBe('30d');
    });

    it('should have all token expiration properties', () => {
      expect(JWT_EXPIRATION).toHaveProperty('ACCESS_TOKEN');
      expect(JWT_EXPIRATION).toHaveProperty('REFRESH_TOKEN');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have message for invalid email', () => {
      expect(ERROR_MESSAGES.INVALID_EMAIL).toBe('Email tidak valid');
    });

    it('should have message for invalid password', () => {
      expect(ERROR_MESSAGES.INVALID_PASSWORD).toBe('Password minimal 6 karakter');
    });

    it('should have message for invalid username', () => {
      expect(ERROR_MESSAGES.INVALID_USERNAME).toBe('Username harus 3-20 karakter, alfanumerik dan underscore saja');
    });

    it('should have message for email exists', () => {
      expect(ERROR_MESSAGES.EMAIL_EXISTS).toBe('Email sudah terdaftar');
    });

    it('should have message for username exists', () => {
      expect(ERROR_MESSAGES.USERNAME_EXISTS).toBe('Username sudah digunakan');
    });

    it('should have message for user not found', () => {
      expect(ERROR_MESSAGES.USER_NOT_FOUND).toBe('User tidak ditemukan');
    });

    it('should have message for invalid credentials', () => {
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBe('Email atau password salah');
    });

    it('should have message for unauthorized', () => {
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBe('Tidak ada akses, login diperlukan');
    });

    it('should have message for forbidden', () => {
      expect(ERROR_MESSAGES.FORBIDDEN).toBe('Anda tidak memiliki izin untuk mengakses resource ini');
    });

    it('should have message for invalid token', () => {
      expect(ERROR_MESSAGES.INVALID_TOKEN).toBe('Token tidak valid atau sudah expired');
    });

    it('should have message for song not found', () => {
      expect(ERROR_MESSAGES.SONG_NOT_FOUND).toBe('Lagu tidak ditemukan');
    });

    it('should have message for playlist not found', () => {
      expect(ERROR_MESSAGES.PLAYLIST_NOT_FOUND).toBe('Playlist tidak ditemukan');
    });

    it('should have message for playlist exists', () => {
      expect(ERROR_MESSAGES.PLAYLIST_EXISTS).toBe('Lagu sudah ada di playlist ini');
    });

    it('should have all error message properties', () => {
      expect(ERROR_MESSAGES).toHaveProperty('INVALID_EMAIL');
      expect(ERROR_MESSAGES).toHaveProperty('INVALID_PASSWORD');
      expect(ERROR_MESSAGES).toHaveProperty('EMAIL_EXISTS');
      expect(ERROR_MESSAGES).toHaveProperty('UNAUTHORIZED');
    });
  });

  describe('SEARCH_TYPES', () => {
    it('should define keyword search type', () => {
      expect(SEARCH_TYPES.KEYWORD).toBe('keyword');
    });

    it('should define mood search type', () => {
      expect(SEARCH_TYPES.MOOD).toBe('mood');
    });

    it('should have all search type properties', () => {
      expect(SEARCH_TYPES).toHaveProperty('KEYWORD');
      expect(SEARCH_TYPES).toHaveProperty('MOOD');
    });

    it('should have valid search type values', () => {
      const validTypes = Object.values(SEARCH_TYPES);
      expect(validTypes).toContain('keyword');
      expect(validTypes).toContain('mood');
    });
  });
});
