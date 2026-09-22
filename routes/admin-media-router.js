import { strictRateLimit } from '../middleware/rateLimit.js';
import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import {
  listMedia,
  deleteMedia,
  deleteOrphanFiles
} from "../controllers/admin-media-controller.js";

const router = Router();

router.get("/medias", isAdmin, listMedia);
router.delete("/medias/:filename", isAdmin, strictRateLimit, deleteMedia);
router.post("/medias/clean-orphans", isAdmin, strictRateLimit, deleteOrphanFiles);

export default router;
