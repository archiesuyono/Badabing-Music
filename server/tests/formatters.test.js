const { formatDuration, formatDate, paginate, escapeHtml } = require('../src/utils/formatters');

describe('Formatters', () => {
  describe('formatDuration', () => {
    it('should format duration in milliseconds to MM:SS', () => {
      expect(formatDuration(180000)).toBe('3:00'); // 3 minutes
      expect(formatDuration(90000)).toBe('1:30');  // 1 minute 30 seconds
      expect(formatDuration(5000)).toBe('0:05');   // 5 seconds
    });

    it('should handle zero milliseconds', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(null)).toBe('0:00');
      expect(formatDuration(undefined)).toBe('0:00');
    });

    it('should format large durations correctly', () => {
      expect(formatDuration(3600000)).toBe('60:00'); // 1 hour
      expect(formatDuration(7200000)).toBe('120:00'); // 2 hours
    });

    it('should pad seconds with leading zero', () => {
      expect(formatDuration(60000)).toBe('1:00');
      expect(formatDuration(65000)).toBe('1:05');
      expect(formatDuration(61000)).toBe('1:01');
    });
  });

  describe('formatDate', () => {
    it('should format date to Indonesian locale', () => {
      const date = new Date('2024-12-11T10:30:00Z');
      const result = formatDate(date);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle string date input', () => {
      const result = formatDate('2024-12-11');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('paginate', () => {
    it('should calculate pagination correctly', () => {
      const result = paginate(100, 10, 0);
      
      expect(result.total).toBe(100);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(result.pages).toBe(10);
    });

    it('should handle string inputs and convert to integers', () => {
      const result = paginate(50, '5', '10');
      
      expect(result.limit).toBe(5);
      expect(result.offset).toBe(10);
    });

    it('should calculate correct page count with remainder', () => {
      const result = paginate(25, 10, 0);
      
      expect(result.pages).toBe(3); // ceil(25/10) = 3
    });

    it('should handle single item pagination', () => {
      const result = paginate(1, 10, 0);
      
      expect(result.pages).toBe(1);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toContain('&lt;');
      expect(escapeHtml('<script>alert("xss")</script>')).toContain('&gt;');
      expect(escapeHtml('<script>alert("xss")</script>')).toContain('&quot;');
    });

    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape all special characters', () => {
      const input = '&<>"\'';
      const expected = '&amp;&lt;&gt;&quot;&#039;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should not escape normal text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
      expect(escapeHtml('123 abc')).toBe('123 abc');
    });
  });
});
