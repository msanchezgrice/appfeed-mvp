import crypto from 'crypto';

function hexToBuf(hex) { return Buffer.from(hex, 'hex'); }

export function getEncKey() {
  const hex = process.env.SECRET_ENCRYPTION_KEY || '';
  if (!hex || hex.length < 64) {
    throw new Error('SECRET_ENCRYPTION_KEY missing or too short. Generate 32 bytes hex.');
  }
  return hexToBuf(hex);
}

export function encryptString(plaintext) {
  const key = getEncKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decryptString(payloadB64) {
  const key = getEncKey();
  const buf = Buffer.from(payloadB64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return plaintext;
}
