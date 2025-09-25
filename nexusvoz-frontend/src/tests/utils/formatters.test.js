import {
  formatCurrency,
  formatDate,
  formatTime,
  formatPhoneNumber,
  formatPercentage,
  validators
} from '../utils/formatters';

describe('formatters', () => {
  test('formatCurrency formats Colombian pesos', () => {
    expect(formatCurrency(1500000, 'COP')).toBe('$1.500.000');
  });

  test('formatDate formats date correctly', () => {
    const date = '2024-09-08T10:30:00Z';
    const formatted = formatDate(date);
    expect(formatted).toContain('sep');
    expect(formatted).toContain('2024');
  });

  test('formatPhoneNumber formats Colombian numbers', () => {
    expect(formatPhoneNumber('573001234567')).toBe('+57 300 123 4567');
  });

  test('formatPercentage formats percentage', () => {
    expect(formatPercentage(0.1567)).toBe('15.7%');
  });
});

describe('validators', () => {
  test('validates email correctly', () => {
    expect(validators.email('test@example.com')).toBe(true);
    expect(validators.email('invalid-email')).toBe(false);
  });

  test('validates phone correctly', () => {
    expect(validators.phone('+573001234567')).toBe(true);
    expect(validators.phone('invalid-phone')).toBe(false);
  });

  test('validates required fields', () => {
    expect(validators.required('test')).toBe(true);
    expect(validators.required('')).toBe(false);
    expect(validators.required(null)).toBe(false);
  });
});

