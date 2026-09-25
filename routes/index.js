import { Router } from "express";
import {
  getHomePage,
  getArticlesByMonth,
  getRenseignementsPage,
  postRenseignements
} from "../controllers/home-controllers.js";
import { getRegisterPage, register } from "../controllers/auth-controller.js";

import { formRateLimit, contactRateLimit } from '../middleware/rateLimit.js';
import { validateRequest } from '../middleware/validate.js';
import { registerSchema, contactSchema } from '../validators/schemas.js';
const router = Router();

router.get("/", getHomePage);
router.get("/auteur/emilie", (req, res) => res.redirect(301, "/article"));
router.get("/a-propos", (req, res) => res.redirect(301, "/"));
router.get("/archive/:year/:month", getArticlesByMonth);
router.get("/renseignements", getRenseignementsPage);

router.get("/mentions-legales", (req, res) => {
  res.render("mentions-legales");
});

router.get("/register", getRegisterPage);
router.post("/register", formRateLimit, validateRequest(registerSchema, { view: "register" }), register);
router.post("/renseignements", contactRateLimit, validateRequest(contactSchema, { view: "renseignements" }), postRenseignements);

export default router;