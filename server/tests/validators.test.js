const { validateEmail, validatePassword, validateUsername, sanitizeUser, sanitizePlaylist } = require('../src/utils/validators');

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('test @example.com')).toBe(false);
      expect(validateEmail('test@ example.com')).toBe(false);
    });

    it('should validate email with multiple subdomains', () => {
      expect(validateEmail('test@mail.example.com')).toBe(true);
      expect(validateEmail('user@subdomain.example.co.uk')).toBe(true);
    });

    it('should reject email without domain extension', () => {
      expect(validateEmail('test@example')).toBe(false);
    });

    it('should validate common email providers', () => {
      expect(validateEmail('test@gmail.com')).toBe(true);
      expect(validateEmail('user@yahoo.com')).toBe(true);
      expect(validateEmail('admin@outlook.com')).toBe(true);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('ValidPassword123')).toBe(true);
    });

    it('should reject weak password', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345')).toBe(false);
      expect(!validatePassword('')).toBe(true);
    });

    it('should accept exactly 6 characters', () => {
      expect(validatePassword('123456')).toBe(true);
      expect(validatePassword('abcdef')).toBe(true);
    });

    it('should reject less than 6 characters', () => {
      expect(validatePassword('12345')).toBe(false);
      expect(validatePassword('abc')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(!validatePassword(null)).toBe(true);
      expect(!validatePassword(undefined)).toBe(true);
    });

    it('should accept long passwords', () => {
      expect(validatePassword('VeryLongPasswordWithManyCharacters123!')).toBe(true);
    });

    it('should accept passwords with special characters', () => {
      expect(validatePassword('Pass@123!$%')).toBe(true);
    });
  });

  describe('validateUsername', () => {
    it('should validate valid username', () => {
      expect(validateUsername('validuser')).toBe(true);
      expect(validateUsername('user_123')).toBe(true);
      expect(validateUsername('username1')).toBe(true);
    });

    it('should reject invalid username', () => {
      expect(validateUsername('ab')).toBe(false); // too short
      expect(validateUsername('')).toBe(false);
      expect(validateUsername('user@name')).toBe(false); // invalid chars
    });

    it('should reject username with spaces', () => {
      expect(validateUsername('user name')).toBe(false);
    });

    it('should reject username with special characters', () => {
      expect(validateUsername('user-name')).toBe(false);
      expect(validateUsername('user.name')).toBe(false);
      expect(validateUsername('user#name')).toBe(false);
    });

    it('should accept exactly 3 characters', () => {
      expect(validateUsername('abc')).toBe(true);
      expect(validateUsername('u_1')).toBe(true);
    });

    it('should accept exactly 20 characters', () => {
      const username20 = 'a'.repeat(20);
      expect(validateUsername(username20)).toBe(true);
    });

    it('should reject more than 20 characters', () => {
      const username21 = 'a'.repeat(21);
      expect(validateUsername(username21)).toBe(false);
    });

    it('should accept underscore in username', () => {
      expect(validateUsername('user_name')).toBe(true);
      expect(validateUsername('_username')).toBe(true);
      expect(validateUsername('username_')).toBe(true);
      expect(validateUsername('user__name')).toBe(true);
    });

    it('should accept numbers in username', () => {
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('123user')).toBe(true);
      expect(validateUsername('us3r')).toBe(true);
    });

    it('should accept mixed case', () => {
      expect(validateUsername('UserName')).toBe(true);
      expect(validateUsername('USERNAME')).toBe(true);
      expect(validateUsername('usErNaMe')).toBe(true);
    });
  });

  describe('sanitizeUser', () => {
    it('should remove password from user object', () => {
      const mockUser = {
        toJSON: jest.fn(() => ({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'secret123',
          createdAt: '2025-01-01'
        }))
      };

      const result = sanitizeUser(mockUser);
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('email');
    });

    it('should remove verification token from user object', () => {
      const mockUser = {
        toJSON: jest.fn(() => ({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          verificationToken: 'token123',
          createdAt: '2025-01-01'
        }))
      };

      const result = sanitizeUser(mockUser);
      expect(result).not.toHaveProperty('verificationToken');
      expect(result).toHaveProperty('username');
    });

    it('should keep other user properties', () => {
      const mockUser = {
        toJSON: jest.fn(() => ({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: 'secret',
          verificationToken: 'token',
          createdAt: '2025-01-01',
          updatedAt: '2025-01-02'
        }))
      };

      const result = sanitizeUser(mockUser);
      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.createdAt).toBe('2025-01-01');
      expect(result.updatedAt).toBe('2025-01-02');
    });
  });

  describe('sanitizePlaylist', () => {
    it('should convert playlist to JSON', () => {
      const mockPlaylist = {
        toJSON: jest.fn(() => ({
          id: 1,
          name: 'My Playlist',
          description: 'Test playlist',
          userId: 1,
          createdAt: '2025-01-01'
        }))
      };

      const result = sanitizePlaylist(mockPlaylist);
      expect(result.id).toBe(1);
      expect(result.name).toBe('My Playlist');
      expect(result.description).toBe('Test playlist');
    });

    it('should call toJSON method', () => {
      const mockPlaylist = {
        toJSON: jest.fn(() => ({
          id: 1,
          name: 'Playlist'
        }))
      };

      sanitizePlaylist(mockPlaylist);
      expect(mockPlaylist.toJSON).toHaveBeenCalled();
    });

    it('should return all playlist properties', () => {
      const mockPlaylist = {
        toJSON: jest.fn(() => ({
          id: 1,
          name: 'Test',
          description: 'Desc',
          userId: 1,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-02',
          songs: []
        }))
      };

      const result = sanitizePlaylist(mockPlaylist);
      expect(Object.keys(result).length).toBeGreaterThan(0);
      expect(result).toEqual(mockPlaylist.toJSON());
    });
  });
});
