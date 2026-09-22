import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

let developmentSecret;
export function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32 && !/very_long_random_secret|change.?me|changez|your.?secret/i.test(secret)) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET robuste (32 caractères minimum) obligatoire.');
  return developmentSecret ||= randomBytes(48).toString('hex');
}
export function appUrl() {
  const url = new URL(process.env.APP_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'));
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
      (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') || !['http:', 'https:'].includes(url.protocol)) {
    throw new Error('APP_URL doit être une origine HTTP(S) canonique, HTTPS en production.');
  }
  return url.origin;
}
export function equalSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function fingerprint(value) {
  return createHmac('sha256', sessionSecret()).update(String(value)).digest('hex');
}
// Jetons à finalité unique : aucune colonne supplémentaire ni modification du schéma.
export function signToken(purpose, payload, binding, lifetimeSeconds = 3600) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + lifetimeSeconds })).toString('base64url');
  const signature = createHmac('sha256', sessionSecret()).update(`${purpose}\0${binding}\0${body}`).digest('base64url');
  return `${body}.${signature}`;
}
export function tokenPayload(token) {
  try {
    if (typeof token !== 'string' || token.length > 2048 || !/^[\w-]+\.[\w-]+$/.test(token)) return null;
    const payload = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    return Number.isSafeInteger(payload.id) && payload.id > 0 && Number.isSafeInteger(payload.exp) && payload.exp > Date.now() / 1000 ? payload : null;
  } catch { return null; }
}
export function verifyToken(token, purpose, binding) {
  const payload = tokenPayload(token);
  if (!payload) return null;
  const [body, sig] = token.split('.');
  const expected = createHmac('sha256', sessionSecret()).update(`${purpose}\0${binding}\0${body}`).digest('base64url');
  return equalSecret(sig, expected) ? payload : null;
}
export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function csvCell(value = '') {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function safeLog(error) {
  // Les erreurs ORM/SMTP peuvent inclure données, SQL, credentials ou destinataires.
  console.error('[application error]', { name: error?.name || 'Error', code: /^[A-Z_0-9]+$/.test(error?.code || '') ? error.code : undefined });
}
