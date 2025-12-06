import express from 'express';
import session from 'express-session';

import indexRoutes from "./routes/index.js";
import articlesRouter from "./routes/article.js";
import authRoutes from "./routes/auth.js";
import newsletterRoutes from "./routes/newsletter.js";
import adminArticleRoutes from "./routes/admin-article-router.js";

import path, { format } from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse urlencoded and json BEFORE method override
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.use(session({
  secret:" unSecretTresFort", // à mettre dans .env en prod
  resave: false,
  saveUninitialized: false
}));
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use("/", indexRoutes);
app.use("/article", articlesRouter);
app.use("/auth", authRoutes);
app.use("/newsletter", newsletterRoutes);
app.use("/admin", adminArticleRoutes);



app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});