import { randomBytes } from 'node:crypto';
import { appUrl, equalSecret } from '../utils/security.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
export function methodOverride(req, res, next) {
  const method = req.query?._method ?? req.body?._method;
  if (method === undefined) return next();
  if (req.method !== 'POST' || typeof method !== 'string' || !['PUT', 'DELETE'].includes(method.toUpperCase())) {
    return res.status(400).send('Méthode non autorisée.');
  }
  req.method = method.toUpperCase();
  next();
}
export function securityHeaders(req, res, next) {
  res.locals.cspNonce = randomBytes(18).toString('base64');
  const nonce = `'nonce-${res.locals.cspNonce}'`;
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': `default-src 'self'; script-src 'self' ${nonce}; script-src-attr 'none'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.cdnfonts.com; font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com https://fonts.cdnfonts.com data:; img-src 'self' https: data:; media-src 'self' https:; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'${process.env.NODE_ENV === 'production' ? '; upgrade-insecure-requests' : ''}`
  });
  if (process.env.NODE_ENV === 'production') res.set('Strict-Transport-Security', 'max-age=31536000');
  next();
}
export function csrfToken(req, res, next) {
  req.session.csrfToken ||= randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  res.set('Cache-Control', 'private, no-store');
  next();
}
export function validCsrf(req) {
  const submitted = req.get('x-csrf-token') || req.body?._csrf;
  return equalSecret(submitted, req.session?.csrfToken);
}
export function csrfProtection(req, res, next) {
  if (safeMethods.has(req.method)) return next();
  const origin = req.get('origin');
  if (req.get('sec-fetch-site') === 'cross-site' || (origin && origin !== appUrl())) {
    return res.status(403).send('Origine non autorisée.');
  }
  // Seules ces routes authentifiées parsèrent ensuite le multipart et vérifient
  // le jeton AVANT de décoder/traiter les fichiers. Aucun autre multipart accepté.
  if (req.is('multipart/form-data')) {
    if (['POST', 'PUT'].includes(req.method) && /^\/admin\/articles(?:\/\d+)?$/.test(req.path)) return next();
    return res.status(415).send('Format non autorisé.');
  }
  if (!validCsrf(req)) return res.status(403).send('Formulaire expiré. Rechargez la page et réessayez.');
  next();
}
