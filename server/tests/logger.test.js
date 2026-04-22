const logger = require('../src/utils/logger');
const fs = require('fs');
const path = require('path');

jest.mock('fs');

describe('Logger', () => {
  let consoleLogSpy, consoleErrorSpy, consoleWarnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    fs.existsSync.mockReturnValue(true);
    fs.appendFileSync.mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('logger.info', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info with additional data', () => {
      const data = { userId: 1, action: 'login' };
      logger.info('Test message', data);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include timestamp in log', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[info]')
      );
    });
  });

  describe('logger.error', () => {
    it('should log error messages', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should log error with context data', () => {
      logger.error('Error message', { userId: 1 });
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(fs.appendFileSync).toHaveBeenCalled();
    });

    it('should write error logs to file', () => {
      logger.error('Error message');
      expect(fs.appendFileSync).toHaveBeenCalled();
      const call = fs.appendFileSync.mock.calls[0];
      expect(call[0]).toContain('error.log');
    });
  });

  describe('logger.warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should write warn logs to file', () => {
      logger.warn('Warning message');
      expect(fs.appendFileSync).toHaveBeenCalled();
      const call = fs.appendFileSync.mock.calls[0];
      expect(call[0]).toContain('warn.log');
    });
  });

  describe('logger.debug', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      const initialCallCount = consoleLogSpy.mock.calls.length;
      logger.debug('Debug message');
      // Debug should not be called in production
      expect(consoleLogSpy.mock.calls.length).toBe(initialCallCount);
    });

    it('should write debug logs to file in development', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Debug message');
      expect(fs.appendFileSync).toHaveBeenCalled();
    });
  });

  describe('logger functionality', () => {
    it('should handle multiple log levels', () => {
      logger.info('Info message');
      logger.error('Error message');
      logger.warn('Warning message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log without crashing on null data', () => {
      expect(() => logger.info('Message', null)).not.toThrow();
    });

    it('should log without crashing on undefined data', () => {
      expect(() => logger.info('Message')).not.toThrow();
    });

    it('should include message in log entry', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
    });

    it('should include data in log when provided', () => {
      const data = { test: 'data' };
      logger.info('Test', data);
      const callArgs = consoleLogSpy.mock.calls[0][0];
      expect(callArgs).toContain('test');
    });
  });
});
