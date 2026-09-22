import { strictRateLimit } from '../middleware/rateLimit.js';
import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import {
  listSubscribers,
  exportSubscribersCSV,
  deleteSubscriber,
  resendConfirmation
} from "../controllers/admin-newsletter-controller.js";

const router = Router();

router.get("/newsletter", isAdmin, listSubscribers);

router.get("/newsletter/export", isAdmin, exportSubscribersCSV);

router.post("/newsletter/:id/resend", isAdmin, strictRateLimit, resendConfirmation);

// ✅ FIX ICI
router.delete("/newsletter/:id", isAdmin, strictRateLimit, deleteSubscriber);

export default router;