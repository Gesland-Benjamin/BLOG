import { Router } from "express";
import { showNewsletterForm, subscribeNewsletter, confirmSubscription, showUnsubscribeForm, unsubscribe } from "../controllers/newsletter-controller.js";
import { validateRequest } from "../middleware/validate.js";
import { newsletterSchema } from "../validators/schemas.js";
import { formRateLimit } from "../middleware/rateLimit.js";

const router = Router();

// Affiche le formulaire d'inscription
router.get("/", showNewsletterForm);

// Traite l'inscription - avec rate limiting
router.post("/subscribe", formRateLimit, validateRequest(newsletterSchema), subscribeNewsletter);

// Confirmer l'inscription via le token
router.get("/confirm/:token", confirmSubscription);

// Afficher le formulaire de désinscription
router.get("/unsubscribe", showUnsubscribeForm);

// Traiter la désinscription
router.post("/unsubscribe", formRateLimit, unsubscribe);

export default router;