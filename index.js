import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

import indexRoutes from "./routes/index.js";
import articlesRouter from "./routes/article.js";
import authRoutes from "./routes/auth.js";
import newsletterRoutes from "./routes/newsletter.js";
import adminArticleRoutes from "./routes/admin-article-router.js";
import adminCategorieRoutes from "./routes/admin-categorie-router.js";
import adminMediaRoutes from "./routes/admin-media-router.js";
import adminCommentRoutes from "./routes/admin-comment-router.js";
import adminNewsletterRoutes from "./routes/admin-newsletter-router.js";
import searchRoutes from "./routes/search.js";
import sitemapRssRoutes from "./routes/sitemap-rss-router.js";
import { getFlashErrors } from "./middleware/validate.js";
import {
  configureHttpsRedirect,
  configureHsts,
  configureHelmet,
  configureCors,
  configureRateLimit,
  configureCompression,
  addSecurityHeaders,
  healthCheck,
  requestLogger,
  globalErrorHandler,
} from "./middleware/security.js";
import productionConfig from "./config/production.js";

import path, { format } from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ===== Configuration sécurité PRODUCTION =====
if (isProduction) {
  // 1. HTTPS Redirection (doit être première)
  app.use(configureHttpsRedirect(productionConfig));
  
  // 2. Security Headers (Helmet) - avant tout middleware
  app.use(configureHelmet(productionConfig));
  
  // 3. HSTS Header
  app.use(configureHsts(productionConfig));
  
  // 4. Compression
  app.use(configureCompression(productionConfig));
  
  // 5. CORS
  app.use(configureCors(productionConfig));
  
  // 6. Rate Limiting (global)
  app.use(configureRateLimit(productionConfig));
  
  // 7. Request Logger
  app.use(requestLogger);
  
  // 8. Additional Security Headers
  app.use(addSecurityHeaders);
} else {
  // Configuration de développement
  app.use(configureCors({ cors: { origin: '*' } }));
  app.use(requestLogger);
}

// ===== Health Check Endpoint =====
app.get('/health', healthCheck);

// ===== Parsing des données =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Middleware pour supporter la méthode PUT/DELETE via _method dans les formulaires
// On priorise la query string car pour multipart/form-data le body n'est pas parsé avant multer
app.use((req, res, next) => {
  const methodFromQuery = req.query && typeof req.query === 'object' && req.query._method;
  const methodFromBody = req.body && typeof req.body === 'object' && req.body._method;
  const method = methodFromQuery || methodFromBody;
  if (method) {
    const upper = String(method).toUpperCase();
    console.log('Override method:', req.method, '=>', upper, 'url:', req.originalUrl);
    req.originalMethod = req.originalMethod || req.method;
    req.method = upper;
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware de session avant la protection CSRF
app.use(session({
  secret: process.env.SESSION_SECRET || 'unSecretParDefautPourDev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en production
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Protection CSRF - générateur de token simplifié
import { randomBytes } from 'crypto';

// Middleware personnalisé pour générer le token CSRF
app.use((req, res, next) => {
  // Initialiser la session CSRF si nécessaire
  if (!req.session.csrfToken) {
    req.session.csrfToken = randomBytes(32).toString('hex');
  }
  
  // Générer le token CSRF pour la réponse
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.message = req.session.message;
  res.locals.csrfToken = req.session.csrfToken || '';
  delete req.session.message;
  next();
});

// Middleware pour extraire les erreurs de validation de la session
app.use(getFlashErrors);

app.use("/", indexRoutes);
app.use("/", sitemapRssRoutes);
app.use("/article", articlesRouter);
app.use("/auth", authRoutes);
app.use("/newsletter", newsletterRoutes);
app.use("/search", searchRoutes);
app.use("/admin", adminArticleRoutes);
app.use("/admin", adminCategorieRoutes);
app.use("/admin", adminMediaRoutes);
app.use("/admin", adminCommentRoutes);
app.use("/admin", adminNewsletterRoutes);

// ===== Middleware 404 - doit être après toutes les routes =====
app.use((req, res, next) => {
  res.status(404).render("404", { article: undefined });
});

// ===== Middleware de gestion des erreurs 500 =====
app.use((err, req, res, next) => {
  if (isProduction) {
    globalErrorHandler(err, req, res, next);
  } else {
    console.error("Erreur serveur:", err);
    res.status(500).render("500", { error: err.stack, article: undefined });
  }
});

// ===== Graceful Shutdown =====
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur ${isProduction ? 'https' : 'http'}://localhost:${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 HTTPS: ${isProduction ? 'activé' : 'désactivé'}`);
});

// Graceful shutdown pour PM2
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, fermeture gracieuse...');
  
  server.close(() => {
    console.log('Serveur fermé');
    process.exit(0);
  });
  
  // Force shutdown après 10 secondes
  setTimeout(() => {
    console.error('Shutdown forcé après timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, fermeture gracieuse...');
  server.close(() => {
    console.log('Serveur fermé');
    process.exit(0);
  });
});

// Handlers pour erreurs non gérées
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});