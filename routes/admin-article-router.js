import { Router } from "express";
import { uploadTwoWithProcessing } from "../config/multer.js";
import { isAdmin } from "../middleware/auth.js";
import { strictRateLimit } from "../middleware/rateLimit.js";
import { showNewArticleForm, createArticle, deleteArticle, showEditArticleForm, updateArticle } from "../controllers/admin-article-controller.js";
import { getDashboard } from "../controllers/admin-dashboard-controller.js";
import { validateRequest } from "../middleware/validate.js";
import { articleSchema } from "../validators/schemas.js";

const router = Router();

router.get("/dashboard", isAdmin, getDashboard);
router.get("/articles/new", isAdmin, showNewArticleForm);
router.get("/articles/:id/edit", isAdmin, showEditArticleForm);

// Utiliser le middleware uploadTwoWithProcessing pour traiter les deux images (principale + inline)
router.post("/articles", isAdmin, strictRateLimit, uploadTwoWithProcessing('article', 'article'), validateRequest(articleSchema), createArticle);
router.put("/articles/:id", isAdmin, strictRateLimit, uploadTwoWithProcessing('article', 'article'), validateRequest(articleSchema), updateArticle);
router.delete("/articles/:id", isAdmin, strictRateLimit, deleteArticle);

export default router;