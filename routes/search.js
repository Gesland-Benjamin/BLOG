import { Router } from "express";
import { searchArticles } from "../controllers/search-controller.js";

const router = Router();

router.get("/", searchArticles);

export default router;
