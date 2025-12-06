import { Router } from "express";
import multer from "multer";
import isAdmin from "../middleware/isAdmin.js";
import { showNewArticleForm, createArticle, deleteArticle, showEditArticleForm, updateArticle } from "../controllers/admin-article-controller.js";

const router = Router();
const upload = multer({ dest: "public/uploads/" });

router.get("/articles/new", isAdmin, showNewArticleForm);
router.get("/articles/:id/edit", isAdmin, showEditArticleForm);
router.post("/articles", isAdmin, upload.single('image'), createArticle);
router.put("/articles/:id", isAdmin, upload.single('image'), updateArticle);
router.delete("/articles/:id", isAdmin, deleteArticle);

export default router;