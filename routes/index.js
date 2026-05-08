import { Router } from "express";
import {
  getHomePage,
  getArticlesByMonth,
  getRenseignementsPage,
  postRenseignements
} from "../controllers/home-controllers.js";
import { getRegisterPage, register } from "../controllers/auth-controller.js";

const router = Router();

router.get("/", getHomePage);
router.get("/archive/:year/:month", getArticlesByMonth);
router.get("/renseignements", getRenseignementsPage);

router.get("/mentions-legales", (req, res) => {
  res.render("mentions-legales");
});

router.get("/register", getRegisterPage);
router.post("/register", register);
router.post("/renseignements", postRenseignements);

export default router;