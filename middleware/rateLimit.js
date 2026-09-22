import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
// Un seul processus applicatif (ecosystem.config.cjs). Avant passage en cluster,
// remplacer cette mémoire bornée par un store partagé atomique.
function ipKey(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  // Regrouper les IPv6 par /56, comme les limiteurs standards.
  if (isIP(ip) === 6) {
    const host = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
    const [a, b = ''] = host.split('::');
    const left = a ? a.split(':') : [], right = b ? b.split(':') : [];
    const parts = host.includes('::') ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right] : left;
    return parts.slice(0, 3).map(x => x.padStart(4, '0')).join(':') + ':' + (parseInt(parts[3], 16) & 0xff00).toString(16);
  }
  return ip;
}
export function rateLimit({ windowMs = 60000, max = 30, keyGenerator = ipKey, maxKeys = 10000 } = {}) {
  const records = new Map();
  let nextCleanup = 0;
  return (req, res, next) => {
    const now = Date.now();
    if (now >= nextCleanup) {
      for (const [key, record] of records) if (record.until <= now) records.delete(key);
      nextCleanup = now + Math.min(windowMs, 60000);
    }
    const key = createHash('sha256').update(String(keyGenerator(req))).digest('hex');
    let record = records.get(key);
    if (!record || record.until <= now) {
      if (!record && records.size >= maxKeys) return res.status(429).send('Veuillez réessayer plus tard.');
      record = { count: 0, until: now + windowMs }; records.set(key, record);
    }
    if (++record.count > max) {
      const retryAfter = Math.max(1, Math.ceil((record.until - now) / 1000));
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Trop de requêtes. Veuillez patienter.', retryAfter });
    }
    next();
  };
}
export const globalRateLimit = rateLimit({ windowMs: 60000, max: 180 });
export const strictRateLimit = rateLimit({ windowMs: 15 * 60000, max: 20 });
export const formRateLimit = rateLimit({ windowMs: 60000, max: 5 });
export const contactRateLimit = rateLimit({ windowMs: 15 * 60000, max: 5 });
export const likeRateLimit = rateLimit({ windowMs: 60000, max: 20 });
export const commentRateLimit = rateLimit({ windowMs: 5 * 60000, max: 3 });
export const searchRateLimit = rateLimit({ windowMs: 60000, max: 30 });
const loginIp = rateLimit({ windowMs: 15 * 60000, max: 30 });
const loginAccount = rateLimit({ windowMs: 15 * 60000, max: 10, keyGenerator: req => typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ipKey(req) });
export const loginRateLimit = [loginIp, loginAccount];
export const recoveryRateLimit = [formRateLimit, rateLimit({ windowMs: 60 * 60000, max: 3, keyGenerator: req => typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ipKey(req) })];
