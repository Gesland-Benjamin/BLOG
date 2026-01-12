import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import { deleteUser } from "../controllers/admin-user-controller.js";

const router = Router();

router.post("/delete/:id", isAdmin, deleteUser);

export default router;
