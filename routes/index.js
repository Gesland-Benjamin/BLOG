import {Router} from "express";
import homeController from "../controllers/home-controllers.js";
import { getRegisterPage, register } from "../controllers/auth-controller.js";

const router = Router();

router.get("/", homeController.getHomePage);
router.get("/register", getRegisterPage);

// Route pour traiter le formulaire d'inscription
router.post("/register", register);


export default router;