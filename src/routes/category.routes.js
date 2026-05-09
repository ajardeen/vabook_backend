import { Router } from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = Router();

router.post("/", authMiddleware, allowRoles("admin"), createCategory);
router.get("/", authMiddleware, allowRoles("admin"), getCategories);
router.get("/:id", authMiddleware, allowRoles("admin"), getCategoryById);
router.put("/:id", authMiddleware, allowRoles("admin"), updateCategory);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteCategory);

export default router;
