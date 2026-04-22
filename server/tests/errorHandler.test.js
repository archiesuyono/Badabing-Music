const errorHandler = require('../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      path: '/test',
      method: 'GET'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should handle error by logging it', () => {
    const error = new Error('Test error');
    errorHandler(error, req, res, next);
    // Error handler logs errors via console.error
    expect(console.error).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalled();
  });

  it('should return JSON response for errors', () => {
    const error = new Error('Test error message');
    error.statusCode = 400;

    errorHandler(error, req, res, next);
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle errors with custom status codes', () => {
    const error = new Error('Custom error');
    error.status = 503;

    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalled();
  });

  it('should handle errors without explicit status code', () => {
    const error = new Error('Generic error');
    errorHandler(error, req, res, next);
    // Should return 500 by default
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });

  it('should log error details with path and method', () => {
    const error = new Error('Detailed error');
    
    errorHandler(error, req, res, next);
    
    expect(console.error).toHaveBeenCalledWith(
      'Error Details:',
      expect.objectContaining({
        message: 'Detailed error',
        endpoint: '/test',
        method: 'GET'
      })
    );
  });

  it('should handle SequelizeValidationError', () => {
    const error = new Error('Validation failed');
    error.name = 'SequelizeValidationError';
    error.errors = [
      { path: 'email', message: 'Invalid email' },
      { path: 'password', message: 'Password too short' }
    ];

    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation error',
      details: expect.arrayContaining([
        expect.objectContaining({ field: 'email', message: 'Invalid email' })
      ])
    });
  });

  it('should handle SequelizeUniqueConstraintError', () => {
    const error = new Error('Unique constraint violation');
    error.name = 'SequelizeUniqueConstraintError';
    error.errors = [
      { path: 'email', message: 'Email already exists' }
    ];

    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Duplicate entry',
      details: expect.arrayContaining([
        expect.objectContaining({ field: 'email', message: 'Email already exists' })
      ])
    });
  });

  it('should handle error with status and message properties', () => {
    const error = new Error('Unauthorized access');
    error.status = 401;
    error.message = 'Token invalid';

    errorHandler(error, req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token invalid'
    });
  });

  it('should include error stack in development environment', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Development error');

    errorHandler(error, req, res, next);
    
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal server error',
        message: 'Development error',
        details: expect.any(String)
      })
    );
  });

  it('should hide error stack in production environment', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Production error');

    errorHandler(error, req, res, next);
    
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal server error',
        message: 'Something went wrong'
      })
    );
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('details');
  });

  it('should handle multiple validation errors', () => {
    const error = new Error('Multiple validation errors');
    error.name = 'SequelizeValidationError';
    error.errors = [
      { path: 'field1', message: 'Error 1' },
      { path: 'field2', message: 'Error 2' },
      { path: 'field3', message: 'Error 3' }
    ];

    errorHandler(error, req, res, next);
    
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation error',
      details: expect.arrayContaining([
        { field: 'field1', message: 'Error 1' },
        { field: 'field2', message: 'Error 2' },
        { field: 'field3', message: 'Error 3' }
      ])
    });
  });

  it('should include stack trace in console.error', () => {
    const error = new Error('Stack trace error');
    
    errorHandler(error, req, res, next);
    
    expect(console.error).toHaveBeenCalledWith(
      'Error Details:',
      expect.objectContaining({
        stack: expect.any(String)
      })
    );
  });

  it('should handle error with name property', () => {
    const error = new Error('Named error');
    
    errorHandler(error, req, res, next);
    
    expect(console.error).toHaveBeenCalledWith(
      'Error Details:',
      expect.objectContaining({
        name: 'Error'
      })
    );
  });
});
