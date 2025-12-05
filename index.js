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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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