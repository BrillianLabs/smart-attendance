import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.NIP_ENCRYPTION_KEY || ''; // 32 chars/64 hex
const HASH_SALT = process.env.NIP_HASH_SALT || '';

export function encrypt(text: string): string {
  if (!text) return text;
  if (!ENCRYPTION_KEY) {
    console.error('NIP_ENCRYPTION_KEY is missing');
    return text;
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text;
  if (!ENCRYPTION_KEY) return text;

  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption failed:', err);
    return text;
  }
}

/**
 * Creates a deterministic hash for lookups (Blind Index)
 */
export function hashNip(nip: string): string {
  if (!nip) return '';
  const cleanNip = nip.trim().replace(/\s/g, '');
  return crypto.createHmac('sha256', HASH_SALT)
    .update(cleanNip)
    .digest('hex');
}
