/**
 * Middleware de sécurité pour production
 * Gère HTTPS, redirection HTTP, HSTS, CORS, rate limiting, compression
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cors from 'cors';

/**
 * Configurer HTTPS et redirection HTTP -> HTTPS
 */
export function configureHttpsRedirect(config) {
  return (req, res, next) => {
    // Vérifier si la requête est en HTTP (derrière un proxy)
    const isHttps = req.protocol === 'https' || 
                    req.headers['x-forwarded-proto'] === 'https' ||
                    req.secure;
    
    if (config.redirectHttp && !isHttps && process.env.NODE_ENV === 'production') {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
    }
    
    next();
  };
}

/**
 * Configurer HSTS (HTTP Strict Transport Security)
 */
export function configureHsts(config) {
  return helmet.hsts({
    maxAge: config.hsts.maxAge,
    includeSubDomains: config.hsts.includeSubDomains,
    preload: config.hsts.preload,
  });
}

/**
 * Configurer les headers de sécurité avec Helmet
 */
export function configureHelmet(config) {
  return helmet({
    contentSecurityPolicy: config.helmet.contentSecurityPolicy,
    frameguard: config.helmet.frameguard,
    noSniff: config.helmet.noSniff,
    xssFilter: config.helmet.xssFilter,
    referrerPolicy: config.helmet.referrerPolicy,
    permittedCrossDomainPolicies: false,
    hsts: false, // On configure HSTS séparément
  });
}

/**
 * Configurer CORS (Cross-Origin Resource Sharing)
 */
export function configureCors(config) {
  return cors({
    origin: (origin, callback) => {
      // Autoriser requêtes sans origin (requests simples, curl, etc)
      if (!origin) return callback(null, true);
      
      // En développement, accepter toutes les origins
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      // En production, vérifier whitelist
      if (config.cors.origin.includes(origin) || config.cors.origin.includes('*')) {
        return callback(null, true);
      }
      
      return callback(new Error('Non autorisé par CORS'));
    },
    credentials: config.cors.credentials,
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    maxAge: config.cors.maxAge,
    optionsSuccessStatus: 200, // Pour IE11
  });
}

/**
 * Configurer le rate limiting
 */
export function configureRateLimit(config) {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: config.rateLimit.message,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: config.rateLimit.skip,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: config.rateLimit.message,
        retryAfter: req.rateLimit.resetTime,
      });
    },
  });
}

/**
 * Configurer la compression
 */
export function configureCompression(config) {
  return compression({
    level: config.compression.level,
    threshold: config.compression.threshold,
    type: ['text/*', 'application/json', 'application/javascript'],
  });
}

/**
 * Middleware pour ajouter des headers de sécurité supplémentaires
 */
export function addSecurityHeaders(req, res, next) {
  // Empêcher le cache du contenu sensible
  if (req.path.includes('/admin') || req.path.includes('/auth')) {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    });
  } else {
    // Cachable content en production
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    });
  }
  
  // Autres headers de sécurité
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });
  
  next();
}

/**
 * Endpoint de health check pour monitoring
 */
export function healthCheck(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
  });
}

/**
 * Logger les informations de requête pour monitoring
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };
    
    // Log les requêtes lentes (> 1s)
    if (duration > 1000) {
      console.warn('[SLOW REQUEST]', log);
    }
    
    // Log les erreurs
    if (res.statusCode >= 400) {
      console.error('[ERROR]', log);
    }
  });
  
  next();
}

/**
 * Middleware pour gérer les erreurs globales
 */
export function globalErrorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';
  
  console.error({
    timestamp: new Date().toISOString(),
    status,
    message,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });
  
  // Ne pas exposer les détails d'erreur en production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(status).json({
    success: false,
    message,
    ...(isDevelopment && { stack: err.stack }),
  });
}
