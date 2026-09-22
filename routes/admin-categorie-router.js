import { strictRateLimit } from '../middleware/rateLimit.js';
import { Router } from "express";
import { isAdmin } from "../middleware/auth.js";
import {
  listCategories,
  showAddCategoryForm,
  createCategory,
  showEditCategoryForm,
  updateCategory,
  deleteCategory
} from "../controllers/admin-categorie-controller.js";
import { validateRequest } from "../middleware/validate.js";
import { categorySchema } from "../validators/schemas.js";

const router = Router();

router.get("/categories", isAdmin, listCategories);
router.get("/categories/new", isAdmin, showAddCategoryForm);
router.get("/categories/:id/edit", isAdmin, showEditCategoryForm);
router.post("/categories", isAdmin, strictRateLimit, validateRequest(categorySchema), createCategory);
router.put("/categories/:id", isAdmin, strictRateLimit, validateRequest(categorySchema), updateCategory);
router.delete("/categories/:id", isAdmin, strictRateLimit, deleteCategory);

export default router;
