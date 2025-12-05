import { Router } from "express";
import { getArticlesParCategorie } from "../controllers/article-controller.js";

const router = Router();

router.get("/", getArticlesParCategorie);

export default router;