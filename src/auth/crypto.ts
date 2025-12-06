/**
 * Cryptographic utilities for authentication.
 *
 * Uses the Web Crypto API for secure password hashing and token generation.
 * Implements PBKDF2 for password hashing with a random salt.
 */

/** Number of PBKDF2 iterations for password hashing */
const PBKDF2_ITERATIONS = 100000;

/** Key length in bits */
const KEY_LENGTH = 256;

/** Salt length in bytes */
const SALT_LENGTH = 16;

/**
 * Generate a cryptographically secure random string.
 * @param length - Number of bytes (output will be 2x in hex)
 */
export function generateRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a unique ID for database records.
 */
export function generateId(): string {
  return generateRandomString(16);
}

/**
 * Generate a session token.
 */
export function generateSessionToken(): string {
  return generateRandomString(32);
}

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns the salt and hash concatenated as: salt$hash
 * @param password - Plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  // Convert to hex strings
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Return salt$hash format
  return `${saltHex}$${hashHex}`;
}

/**
 * Verify a password against a stored hash.
 * @param password - Plain text password to verify
 * @param storedHash - Stored hash in salt$hash format
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, expectedHashHex] = storedHash.split('$');

  if (!saltHex || !expectedHashHex) {
    return false;
  }

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Convert salt from hex
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2 with same salt
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  // Convert to hex and compare
  const computedHashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(computedHashHex, expectedHashHex);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate a password reset token with expiration.
 * @param expirationMinutes - Token expiration time in minutes (default: 60)
 */
export function generatePasswordResetToken(expirationMinutes: number = 60): {
  token: string;
  expiresAt: string;
} {
  const token = generateRandomString(32);
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();
  return { token, expiresAt };
}

/**
 * Check if a token has expired.
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}
