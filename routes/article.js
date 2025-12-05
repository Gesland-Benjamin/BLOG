import { Router } from "express";
import { getArticlesParCategorie, getArticlesByCategorieName } from "../controllers/article-controller.js";

const router = Router();

// Rendre la page /article avec le dernier article par catégorie
router.get("/", getArticlesParCategorie);

// Afficher la liste des articles pour une catégorie donnée
router.get("/categorie/:nom", getArticlesByCategorieName);

export default router;