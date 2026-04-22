const {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken
} = require('../src/utils/authUtils');
const jwt = require('jsonwebtoken');

describe('Authentication Utils', () => {
  const testPassword = 'TestPassword123!';
  const testUserId = 1;
  const testEmail = 'test@example.com';
  const testUsername = 'testuser';

  // Mock JWT_SECRET
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const hashedPassword = await hashPassword(testPassword);
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(testPassword);
      expect(typeof hashedPassword).toBe('string');
    });

    it('should create different hashes for the same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hashedPassword = await hashPassword('');
      expect(hashedPassword).toBeDefined();
      expect(typeof hashedPassword).toBe('string');
    });
  });

  describe('comparePassword', () => {
    let hashedPassword;

    beforeEach(async () => {
      hashedPassword = await hashPassword(testPassword);
    });

    it('should return true for correct password', async () => {
      const result = await comparePassword(testPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const result = await comparePassword('WrongPassword', hashedPassword);
      expect(result).toBe(false);
    });

    it('should return false for empty password comparison', async () => {
      const result = await comparePassword('', hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(jwt, testUserId, testEmail, testUsername);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should contain correct payload', () => {
      const token = generateToken(jwt, testUserId, testEmail, testUsername);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.email).toBe(testEmail);
      expect(decoded.username).toBe(testUsername);
    });

    it('should have expiration of 7 days', () => {
      const token = generateToken(jwt, testUserId, testEmail, testUsername);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      
      // 7 days in seconds
      expect(expiresIn).toBe(7 * 24 * 60 * 60);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(jwt, testUserId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should contain correct payload', () => {
      const token = generateRefreshToken(jwt, testUserId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.userId).toBe(testUserId);
    });

    it('should have expiration of 30 days', () => {
      const token = generateRefreshToken(jwt, testUserId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const expiresIn = decoded.exp - decoded.iat;
      
      // 30 days in seconds
      expect(expiresIn).toBe(30 * 24 * 60 * 60);
    });
  });
});
