import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is not defined');
  }
  // Ensure key is 32 bytes for aes-256
  return crypto.scryptSync(secret, 'salt', 32);
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Return as iv:tag:encrypted
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

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
