import { strictRateLimit } from '../middleware/rateLimit.js';
import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import { listCommentsAdmin, approveComment, rejectComment, markSpamComment, deleteComment, replyToComment } from "../controllers/admin-comment-controller.js";

const router = Router();

router.get("/commentaires", isAdmin, listCommentsAdmin);
router.post("/commentaires/:id/approve", isAdmin, strictRateLimit, approveComment);
router.post("/commentaires/:id/reject", isAdmin, strictRateLimit, rejectComment);
router.post("/commentaires/:id/spam", isAdmin, strictRateLimit, markSpamComment);
router.post("/commentaires/:id/reply", isAdmin, strictRateLimit, replyToComment);
router.delete("/commentaires/:id", isAdmin, strictRateLimit, deleteComment);

export default router;
