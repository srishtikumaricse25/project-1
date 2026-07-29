import crypto from 'crypto';

// AES-256 Encryption key from environment variable or secure 32-byte default
const SECRET_KEY = process.env.ENCRYPTION_KEY 
  ? crypto.scryptSync(process.env.ENCRYPTION_KEY, 'silent-sos-salt-2026', 32)
  : crypto.scryptSync('silent-sos-production-master-encryption-key-32b', 'silent-sos-salt-2026', 32);

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt a text string using AES-256-CBC
 */
export function encryptField(text) {
  if (text === null || text === undefined || text === '') return text;
  if (typeof text !== 'string') text = String(text);
  
  // Skip if already encrypted
  if (text.startsWith('enc::')) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `enc::${iv.toString('hex')}::${encrypted}`;
}

/**
 * Decrypt an AES-256-CBC encrypted string
 */
export function decryptField(encryptedText) {
  if (typeof encryptedText !== 'string' || !encryptedText.startsWith('enc::')) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split('::');
    if (parts.length !== 3) return encryptedText;

    const iv = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.warn('[Encryption] Decryption failed, returning raw input:', err.message);
    return encryptedText;
  }
}

/**
 * Encrypt specific fields of an object
 */
export function encryptObjectFields(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  
  fields.forEach(field => {
    if (clone[field] !== undefined && clone[field] !== null) {
      clone[field] = encryptField(clone[field]);
    }
  });

  return clone;
}

/**
 * Decrypt specific fields of an object
 */
export function decryptObjectFields(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  
  fields.forEach(field => {
    if (clone[field] !== undefined && clone[field] !== null) {
      clone[field] = decryptField(clone[field]);
    }
  });

  return clone;
}
