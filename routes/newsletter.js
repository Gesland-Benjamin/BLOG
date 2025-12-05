import { Router } from "express";
import { showNewsletterForm, subscribeNewsletter } from "../controllers/newsletter-controller.js";

const router = Router();

// Affiche le formulaire
router.get("/", showNewsletterForm);

// Traite l'inscription
router.post("/subscribe", subscribeNewsletter);

export default router;