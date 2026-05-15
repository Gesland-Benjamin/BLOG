import dotenv from "dotenv";
 dotenv.config(); // Load .env for development

import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import argon2 from "argon2";
import SequelizeStoreFactory from "connect-session-sequelize";

import sequelize, { testConnection } from "./config/database.js";

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
testConnection();

// =========================
// TRUST PROXY
// =========================
if (isProduction) app.set("trust proxy", 1);

// =========================
// PARSERS
// =========================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// =========================
// VIEWS
// =========================
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// =========================
// STATIC
// =========================
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
    secret: process.env.SESSION_SECRET || "very_long_random_secret_key_2024",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);

// =========================
// CSRF SIMPLE
// =========================
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

// =========================
// USER GLOBAL
// =========================
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  req.user = req.session?.user || null;
  next();
});

// =========================
// FLASH
// =========================
app.use((req, res, next) => {
  res.locals.message = req.session.message || null;
  delete req.session.message;
  next();
});

// =========================
// LOGGER
// =========================
app.use((req, res, next) => {
  console.log(
    `[REQ] ${req.method} ${req.originalUrl} | user:${req.user?.id || "guest"} | ip:${req.ip}`
  );
  next();
});

// =========================
// METHOD OVERRIDE
// =========================
app.use((req, res, next) => {
  const method = req.query?._method || req.body?._method;
  if (method) req.method = method.toUpperCase();
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
    console.error("[CATEGORIES ERROR]", err.message);
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
  console.error("[500]", err);

  res.status(500).render("500", {
    error: isProduction ? null : err.message
  });
});

// =========================
// SERVER
// =========================
let server;

async function startServer() {
  await sessionStore.sync();

  server = app.listen(PORT, () => {
    console.log(`🚀 http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("❌ Échec du démarrage du serveur:", error);
  process.exit(1);
});

// =========================
// HASH TEST (REMOVE IN PROD)
// =========================
(async () => {
  const hash = await argon2.hash("Alexandre145");
  console.log("Sample hash:", hash);
})();

// =========================
// GRACEFUL SHUTDOWN
// =========================
["SIGTERM", "SIGINT"].forEach((sig) => {
  process.on(sig, () => {
    server.close(() => process.exit(0));
  });
});