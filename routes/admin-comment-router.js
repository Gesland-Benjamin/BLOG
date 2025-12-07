import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import { listCommentsAdmin, approveComment, rejectComment, markSpamComment, deleteComment } from "../controllers/admin-comment-controller.js";

const router = Router();

router.get("/commentaires", isAdmin, listCommentsAdmin);
router.post("/commentaires/:id/approve", isAdmin, approveComment);
router.post("/commentaires/:id/reject", isAdmin, rejectComment);
router.post("/commentaires/:id/spam", isAdmin, markSpamComment);
router.delete("/commentaires/:id", isAdmin, deleteComment);

export default router;
