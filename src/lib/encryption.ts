import crypto from 'crypto';

/** Encryption algorithm used (AES-256-GCM). */
const ALGORITHM = 'aes-256-gcm';
/** Length of the initialization vector in bytes. */
const IV_LENGTH = 16;

/**
 * Derives a 32-byte key from the ENCRYPTION_KEY environment variable using scrypt.
 *
 * @returns A 32-byte Buffer key.
 * @throws {Error} If ENCRYPTION_KEY is not defined.
 */
function getKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is not defined');
  }
  // Ensure key is 32 bytes for aes-256
  return crypto.scryptSync(secret, 'salt', 32);
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 *
 * @param text - The plain text to encrypt.
 * @returns The encrypted string in the format "iv:tag:encrypted".
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Return as iv:tag:encrypted
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a string encrypted with the `encrypt` function.
 *
 * @param text - The encrypted string in the format "iv:tag:encrypted".
 * @returns The decrypted plain text string.
 * @throws {Error} If the encrypted string format is invalid.
 */
export function decrypt(text: string): string {
  const parts = text.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format');
  }

  const [ivHex, tagHex, encryptedHex] = parts;

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final('utf8');
}
