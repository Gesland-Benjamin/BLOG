// Middleware simple de rate limiting en mémoire
// Pour une solution production, utiliser Redis ou une base de données

const rateLimits = new Map();

// Nettoyer les anciennes entrées toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimits.entries()) {
    if (now - data.resetTime > 0) {
      rateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter configurable
 * @param {Object} options - Options de configuration
 * @param {number} options.windowMs - Fenêtre de temps en millisecondes (défaut: 15 min)
 * @param {number} options.max - Nombre maximum de requêtes (défaut: 100)
 * @param {string} options.message - Message d'erreur personnalisé
 * @param {Function} options.keyGenerator - Fonction pour générer la clé (défaut: IP)
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes par défaut
    max = 100,
    message = 'Trop de requêtes, veuillez réessayer plus tard.',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = rateLimits.get(key);
    
    if (!record) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimits.set(key, record);
      return next();
    }
    
    // Si la fenêtre de temps est expirée, réinitialiser
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    // Incrémenter le compteur
    record.count++;
    
    // Vérifier la limite
    if (record.count > max) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    next();
  };
}

// Rate limiter strict pour les actions sensibles
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Trop de tentatives. Veuillez patienter avant de réessayer.'
});

// Rate limiter pour les formulaires
export const formRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Trop de soumissions. Veuillez patienter une minute.'
});

// Rate limiter pour les likes
export const likeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'Trop de likes en peu de temps. Veuillez patienter.'
});

// Rate limiter pour les commentaires
export const commentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: 'Trop de commentaires. Veuillez patienter quelques minutes.'
});

// Rate limiter pour les connexions
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
  keyGenerator: (req) => {
    // Utiliser l'email si fourni, sinon l'IP
    return req.body?.email || req.ip || req.connection.remoteAddress;
  }
});
