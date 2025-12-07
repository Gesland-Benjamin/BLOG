/**
 * Configuration de production
 * Centralize les paramètres pour un environnement production
 */

export const productionConfig = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: 'production',
  appUrl: process.env.APP_URL || 'https://yourdomain.com',
  
  // HTTPS & SSL
  https: {
    enabled: process.env.HTTPS_ENABLED !== 'false',
    // En production, utiliser process.env.SSL_KEY et process.env.SSL_CERT
    // ou charger depuis des fichiers avec fs.readFileSync()
    keyPath: process.env.SSL_KEY_PATH,
    certPath: process.env.SSL_CERT_PATH,
  },

  // HTTP to HTTPS redirection
  redirectHttp: process.env.REDIRECT_HTTP !== 'false',
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 an en secondes
    includeSubDomains: true,
    preload: true,
  },

  // CORS
  cors: {
    enabled: true,
    origin: (process.env.CORS_ORIGINS || 'https://yourdomain.com').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 heures
  },

  // Rate Limiting
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par IP par fenêtre
    message: 'Trop de requêtes, veuillez réessayer plus tard',
    skip: (req) => {
      // Ignorer le rate limit pour les health checks
      return req.path === '/health';
    },
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET,
    secure: true, // HTTPS uniquement
    httpOnly: true,
    sameSite: 'strict', // Protection CSRF renforcée
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
  },

  // Compression
  compression: {
    enabled: true,
    level: 6, // 0-9, plus haut = plus de compression mais plus lent
    threshold: 1024, // Compresser si > 1KB
  },

  // Security headers (Helmet)
  helmet: {
    enabled: true,
    frameguard: { action: 'deny' }, // X-Frame-Options
    xssFilter: true, // X-XSS-Protection
    noSniff: true, // X-Content-Type-Options
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Pour Bootstrap inline scripts
        styleSrc: ["'self'", "'unsafe-inline'"], // Pour CSS inline
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  },

  // Logging
  logging: {
    level: 'info', // debug, info, warn, error
    format: 'combined', // morgan format
  },

  // Database
  database: {
    logging: false, // Désactiver logs SQL en production
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },

  // Uploads
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    tempDir: process.env.TEMP_DIR || '/tmp/blog-uploads',
    staticDir: process.env.STATIC_DIR || '/var/www/blog/uploads',
  },
};

export default productionConfig;
