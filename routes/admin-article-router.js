import { Router } from "express";
import multer from "multer";
import isAdmin from "../middleware/isAdmin.js";
import { showNewArticleForm, createArticle } from "../controllers/admin-article-controller.js";

const router = Router();
const upload = multer({ dest: "public/uploads/" });

router.get("/articles/new", isAdmin, showNewArticleForm);
router.post("/articles", isAdmin, upload.single('image'), createArticle);

export default router;