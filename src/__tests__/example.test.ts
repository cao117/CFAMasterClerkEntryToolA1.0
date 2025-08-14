import { describe, test, expect } from '@jest/globals';

describe('Jest Setup Verification', () => {
  test('should be able to run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  test('should handle string operations', () => {
    const greeting = 'Hello, Jest!';
    expect(greeting).toContain('Jest');
    expect(greeting.length).toBeGreaterThan(0);
  });

  test('should work with arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
  });
});