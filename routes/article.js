import { Router } from "express";
import { getArticlesParCategorie, getArticlesByCategorieName, getArticleById, likeArticle } from "../controllers/article-controller.js";

const router = Router();

// Rendre la page /article avec le dernier article par catégorie
router.get("/", getArticlesParCategorie);

// Afficher la liste des articles pour une catégorie donnée
router.get("/categorie/:nom", getArticlesByCategorieName);

// Liker un article (accessible à tous)
router.post("/:id/like", likeArticle);

// Afficher un article par son id (placer après la route /categorie pour éviter les conflits)
router.get("/:id", getArticleById);

export default router;