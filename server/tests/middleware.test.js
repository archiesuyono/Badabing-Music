const authenticateToken = require('../src/middleware/authenticateToken');
const jwt = require('jsonwebtoken');

describe('authenticateToken Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
    
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should authenticate valid token', () => {
    const token = jwt.sign({ userId: 1, email: 'test@example.com' }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(req.userId).toBe(1);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 if no token provided', () => {
    req.headers.authorization = undefined;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if token is invalid', () => {
    req.headers.authorization = 'Bearer invalid-token';

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 403 if authorization header format is wrong', () => {
    req.headers.authorization = 'InvalidFormat token';

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should extract userId from valid token payload', () => {
    const userId = 42;
    const token = jwt.sign({ userId, email: 'test@example.com' }, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(req.userId).toBe(userId);
  });

  it('should handle TokenExpiredError', () => {
    const expiredToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    req.headers.authorization = `Bearer ${expiredToken}`;

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token has expired'
    });
  });

  it('should set req.user from decoded token', () => {
    const tokenData = { userId: 1, email: 'test@example.com', role: 'user' };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    authenticateToken(req, res, next);

    expect(req.user).toEqual(expect.objectContaining({
      userId: 1,
      email: 'test@example.com'
    }));
  });

  it('should handle authorization header without Bearer prefix', () => {
    req.headers.authorization = 'token-without-bearer';

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should handle empty authorization header', () => {
    req.headers.authorization = '';

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
