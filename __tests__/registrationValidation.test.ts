
import { validateRegistration } from '../src/utils/registrationValidation';

describe('US01 - Registration Validation', () => {
  test('rejects empty required fields', () => {
    expect(
      validateRegistration('', '', ''),
    ).toBe('Please fill in all fields.');
  });

  test('rejects invalid email format', () => {
    expect(
      validateRegistration('Fabio', 'not-an-email', 'Password123'),
    ).toBe('Please enter a valid email address.');
  });

  test('rejects passwords shorter than 8 characters', () => {
    expect(
      validateRegistration('Fabio', 'test@example.com', 'Pass1'),
    ).toBe('Password must be at least 8 characters long.');
  });

  test('rejects passwords without a number', () => {
    expect(
      validateRegistration('Fabio', 'test@example.com', 'Password'),
    ).toBe(
      'Password must contain at least one letter and one number.',
    );
  });

  test('rejects passwords without a letter', () => {
    expect(
      validateRegistration('Fabio', 'test@example.com', '12345678'),
    ).toBe(
      'Password must contain at least one letter and one number.',
    );
  });

  test('accepts valid registration information', () => {
    expect(
      validateRegistration('Fabio', 'test@example.com', 'Password123'),
    ).toBeNull();
  });
});
