
/**
 * Mobile Driver Analytics System
 * US01 / AB#15 - Driver Registration
 * Registration input validation
 */

export function validateRegistration(
  fullName: string,
  email: string,
  password: string,
): string | null {
  if (!fullName.trim() || !email.trim() || !password) {
    return 'Please fill in all fields.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email.trim())) {
    return 'Please enter a valid email address.';
  }

  // Project minimum: 8 characters, a letter and a number.
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }

  return null;
}
