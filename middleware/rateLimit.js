// middleware/rateLimit.js

const rateLimits = new Map();

// Nettoyer les anciennes entrées toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimits.entries()) {
    if (now - data.resetTime > 0) {
      rateLimits.delete(key);
      console.log(`[RATE LIMIT CLEANUP] Cleared key: ${key}`);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter configurable avec logs
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Trop de requêtes, veuillez réessayer plus tard.',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    let record = rateLimits.get(key);

    console.log(`[RATE LIMIT] Attempt for key: ${key}, URL: ${req.originalUrl}, User-Agent: ${req.headers['user-agent']}`);

    if (!record) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimits.set(key, record);
      console.log(`[RATE LIMIT] First request, count set to 1, window expires at ${new Date(record.resetTime).toISOString()}`);
      return next();
    }

    // Réinitialiser si la fenêtre est expirée
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      console.log(`[RATE LIMIT] Window reset, count = 1, new resetTime = ${new Date(record.resetTime).toISOString()}`);
      return next();
    }

    // Incrémenter le compteur
    record.count++;

    // Vérifier la limite
    if (record.count > max) {
      console.warn(`[RATE LIMIT] Limit exceeded for key: ${key}, count: ${record.count}, max: ${max}`);
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    console.log(`[RATE LIMIT] Allowed, count: ${record.count}/${max}`);
    next();
  };
}

// Rate limiters spécifiques
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Trop de tentatives. Veuillez patienter avant de réessayer.'
});

export const formRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Trop de soumissions. Veuillez patienter une minute.'
});

export const likeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Trop de likes en peu de temps. Veuillez patienter.'
});

export const commentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: 'Trop de commentaires. Veuillez patienter quelques minutes.'
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  keyGenerator: (req) => req.body?.email || req.ip || req.connection.remoteAddress
});