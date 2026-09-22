import { createHmac } from 'node:crypto';
import { equalSecret } from './security.js';

function decodeBase32(value) {
  if (typeof value !== 'string' || !/^[A-Z2-7]{26,128}=*$/i.test(value)) throw new Error('Secret TOTP invalide');
  let bits = '';
  for (const c of value.toUpperCase().replace(/=+$/, '')) bits += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
export function totp(secret, counter, digits = 6) {
  const message = Buffer.alloc(8); message.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac('sha1', decodeBase32(secret)).update(message).digest();
  const offset = mac[mac.length - 1] & 15;
  return String((mac.readUInt32BE(offset) & 0x7fffffff) % (10 ** digits)).padStart(digits, '0');
}
const usedCounters = new Map();
export function verifyAdminMfa(user, code, now = Date.now()) {
  if (user.role !== 'admin') return true;
  let secrets;
  try { secrets = JSON.parse(process.env.ADMIN_TOTP_SECRETS || '{}'); } catch { return false; }
  const secret = secrets[user.email.toLowerCase()];
  // En développement uniquement, les comptes sans facteur configuré restent utilisables.
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return false;
  const counter = Math.floor(now / 30000);
  try {
    for (const step of [counter, counter - 1, counter + 1]) {
      if (step > (usedCounters.get(user.id) ?? -1) && equalSecret(code, totp(secret, step))) {
        usedCounters.set(user.id, step); return true;
      }
    }
  } catch { return false; }
  return false;
}
