import dotenv from "dotenv";
 dotenv.config(); // Load .env for development

import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";


import SequelizeStoreFactory from "connect-session-sequelize";

import sequelize from "./config/database.js";

// =========================
// MODELS + ASSOCIATIONS
// =========================
import "./models/index.js";
import { initAssociations } from "./models/index.js";

// ⚠️ SAFE INIT (évite double init)
initAssociations();

// =========================
// ROUTES
// =========================
import indexRoutes from "./routes/index.js";
import articlesRouter from "./routes/article.js";
import authRoutes from "./routes/auth.js";
import newsletterRoutes from "./routes/newsletter.js";
import adminArticleRoutes from "./routes/admin-article-router.js";
import adminCategorieRoutes from "./routes/admin-categorie-router.js";
import adminCommentRoutes from "./routes/admin-comment-router.js";
import adminNewsletterRoutes from "./routes/admin-newsletter-router.js";
import adminUserRoutes from "./routes/admin-user-router.js";
import categoriesRoutes from "./routes/categories.article.js";
import searchRoutes from "./routes/search.js";
import sitemapRssRoutes from "./routes/sitemap-rss-router.js";

// =========================
// MIDDLEWARE
// =========================
import { getFlashErrors } from "./middleware/validate.js";
import { getUploadsDir, assertPrivateTempDir } from "./utils/uploadPaths.js";
import { sessionSecret, appUrl, safeLog } from './utils/security.js';
import { methodOverride, securityHeaders, csrfToken, csrfProtection } from './middleware/requestSecurity.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { loadSessionUser } from './middleware/sessionUser.js';
import User from './models/User.model.js';

// =========================
// INIT APP
// =========================
const SequelizeStore = SequelizeStoreFactory(session.Store);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// =========================
// DB TEST
// =========================
const secret = sessionSecret();
appUrl();
assertPrivateTempDir();
if (process.env.NODE_APP_INSTANCE && process.env.NODE_APP_INSTANCE !== '0') {
  throw new Error('Un seul worker autorisé avec le rate limiter mémoire.');
}

// =========================
// TRUST PROXY
// =========================
// Configurer uniquement les adresses/CIDR des proxies réellement utilisés.
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY.split(',').map(s => s.trim()));
app.disable('x-powered-by');
app.use(securityHeaders);
app.use(globalRateLimit);

// =========================
// PARSERS
// =========================
app.use(express.urlencoded({ extended: false, limit: "100kb", parameterLimit: 100 }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// =========================
// VIEWS
// =========================
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// =========================
// STATIC
// =========================
// Ne jamais servir les anciens originaux temporaires, même s'ils sont encore sur disque.
app.use('/uploads', (req, res, next) => {
  if (!/^\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif)$/i.test(req.path)) return res.sendStatus(404);
  next();
}, express.static(getUploadsDir(), { dotfiles: 'deny', index: false }));
app.use(express.static(path.join(__dirname, "public")));

// =========================
// SESSION STORE
// =========================
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: "sessions",
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 24 * 60 * 60 * 1000
});

app.use(
  session({
    name: "sid",
    secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// Relire le compte avant CSRF : une session périmée est régénérée sans réutiliser son jeton.
app.use(loadSessionUser(User));
app.use(csrfToken);
app.use(methodOverride);
app.use(csrfProtection);

// =========================
// FLASH
// =========================
app.use((req, res, next) => {
  res.locals.message = req.session.message || null;
  delete req.session.message;
  next();
});

// =========================
// CATEGORIES CACHE (STABLE)
// =========================
import { Categorie } from "./models/index.js";

let cachedCategories = [];
let categoriesLoadedAt = 0;
const CACHE_TTL = 1000 * 60; // 1 minute au lieu de 5

// Fonction pour invalider le cache immédiatement
export const invalidateCategoriesCache = () => {
  cachedCategories = [];
  categoriesLoadedAt = 0;
};

app.use(async (req, res, next) => {
  try {
    const now = Date.now();

    if (!cachedCategories.length || now - categoriesLoadedAt > CACHE_TTL) {
      cachedCategories = await Categorie.findAll({
        order: [["name", "ASC"]]
      });

      categoriesLoadedAt = now;
    }

    res.locals.categories = cachedCategories;
  } catch (err) {
    safeLog(err);
    res.locals.categories = [];
  }

  next();
});

// =========================
// VALIDATION ERRORS
// =========================
app.use(getFlashErrors);

// =========================
// ROUTES
// =========================
app.use("/", indexRoutes);
app.use("/article", articlesRouter);
app.use("/auth", authRoutes);
app.use("/newsletter", newsletterRoutes);
app.use("/categories", categoriesRoutes);
app.use("/search", searchRoutes);
app.use("/", sitemapRssRoutes);
app.use("/admin", adminArticleRoutes);
app.use("/admin", adminCategorieRoutes);
app.use("/admin", adminCommentRoutes);
app.use("/admin", adminNewsletterRoutes);
app.use("/admin/users", adminUserRoutes);

// =========================
// 404
// =========================
app.use((req, res) => {
  res.status(404).render("404", { article: undefined });
});

// =========================
// ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
  safeLog(err);

  res.status(Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500).render("500", {
    error: isProduction ? null : err.message
  });
});

// =========================
// SERVER
// =========================
let server;

async function startServer() {
  // Lecture uniquement : le schéma existant doit déjà avoir sa table sessions.
  await sequelize.authenticate();

  server = app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  safeLog(error);
  process.exit(1);
});

// =========================
// GRACEFUL SHUTDOWN
// =========================
["SIGTERM", "SIGINT"].forEach((sig) => {
  process.on(sig, () => {
    server?.close(() => process.exit(0));
  });
});
