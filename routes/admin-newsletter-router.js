import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import { listSubscribers, exportSubscribersCSV, deleteSubscriber, resendConfirmation } from "../controllers/admin-newsletter-controller.js";

const router = Router();

// Liste des abonnés
router.get("/newsletter", isAdmin, listSubscribers);

// Export CSV
router.get("/newsletter/export", isAdmin, exportSubscribersCSV);

// Renvoyer email de confirmation
router.post("/newsletter/:id/resend", isAdmin, resendConfirmation);

// Supprimer un abonné
router.delete("/newsletter/:id", isAdmin, deleteSubscriber);

export default router;
