import { Router } from "express";
import { searchArticles } from "../controllers/search-controller.js";

import { searchRateLimit } from '../middleware/rateLimit.js';
const router = Router();

router.get("/", searchRateLimit, searchArticles);

export default router;
