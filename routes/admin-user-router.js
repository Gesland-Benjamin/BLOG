import { strictRateLimit } from '../middleware/rateLimit.js';
import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import { deleteUser } from "../controllers/admin-user-controller.js";

const router = Router();

router.post("/delete/:id", isAdmin, strictRateLimit, deleteUser);

export default router;
