import crypto from 'crypto';

// 32‑byte key for AES‑256‑GCM – should be set via env var in production
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_test_key_32bytes_long!!!'; // placeholder only
if (ENCRYPTION_KEY.length !== 32) {
  console.warn('ENCRYPTION_KEY should be 32 characters for AES‑256');
}
const KEY = Buffer.from(ENCRYPTION_KEY);

/** Encrypt a value (object, string, number, etc.)
 * Returns a base64 string in the form iv.ciphertext.authTag
 */
export function encrypt(value) {
  if (value === undefined || value === null) return value;
  const iv = crypto.randomBytes(12); // GCM recommended IV size
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const plaintext = typeof value === 'string' ? value : JSON.stringify(value);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${encrypted}.${authTag.toString('base64')}`;
}

/** Decrypt a value produced by `encrypt` */
export function decrypt(enc) {
  if (enc === undefined || enc === null || typeof enc !== 'string') return enc;
  const parts = enc.split('.');
  if (parts.length !== 3) return enc; // not in expected encrypted format (iv.encrypted.tag)
  const [ivB64, encryptedB64, tagB64] = parts;
  if (!ivB64 || !encryptedB64 || !tagB64) return enc;
  try {
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    if (authTag.length !== 16) return enc; // GCM authentication tag must be 16 bytes
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    try {
      return JSON.parse(decrypted);
    } catch (_) {
      return decrypted;
    }
  } catch (_) {
    return enc; // Return original value if decryption fails (e.g. unencrypted plain text)
  }
}
