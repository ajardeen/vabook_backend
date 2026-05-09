import { Router } from "express";
import {
  createMenu,
  getMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
} from "../controllers/menu.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = Router();

router.post("/", authMiddleware, allowRoles("admin"), createMenu);
router.get("/", authMiddleware, allowRoles("admin"), getMenus);
router.get("/:id", authMiddleware, allowRoles("admin"), getMenuById);
router.put("/:id", authMiddleware, allowRoles("admin"), updateMenu);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteMenu);

export default router;
