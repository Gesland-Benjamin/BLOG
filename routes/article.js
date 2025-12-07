import { Router } from "express";
import { getArticlesParCategorie, getArticlesByCategorieName, getArticleById, likeArticle, postComment } from "../controllers/article-controller.js";
import { validateRequest } from "../middleware/validate.js";
import { commentSchema } from "../validators/schemas.js";
import { likeRateLimit, commentRateLimit } from "../middleware/rateLimit.js";

const router = Router();

// Rendre la page /article avec le dernier article par catégorie
router.get("/", getArticlesParCategorie);

// Afficher la liste des articles pour une catégorie donnée
router.get("/categorie/:nom", getArticlesByCategorieName);

// Liker un article (accessible à tous) - avec rate limiting
router.post("/:id/like", likeRateLimit, likeArticle);

// Poster un commentaire (modération requise) - avec rate limiting
router.post("/:id/comment", commentRateLimit, validateRequest(commentSchema), postComment);

// Afficher un article par son id (placer après la route /categorie pour éviter les conflits)
router.get("/:id", getArticleById);

export default router;