import {Router} from "express";
import homeController from "../controllers/home-controllers.js";
import { getRegisterPage, register } from "../controllers/auth-controller.js";

const router = Router();

router.get("/", homeController.getHomePage);
router.get("/archive/:year/:month", homeController.getArticlesByMonth);
router.get("/renseignements", homeController.getRenseignementsPage);
router.get("/mentions-legales", (req, res) => {
  res.render("mentions-legales");
});
router.get("/register", getRegisterPage);

// Route pour traiter le formulaire d'inscription
router.post("/register", register);
router.post("/renseignements", homeController.postRenseignements);


export default router;