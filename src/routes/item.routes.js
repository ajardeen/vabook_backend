import { Router } from "express";
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} from "../controllers/item.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = Router();

router.post("/", authMiddleware, allowRoles("admin"), createItem);
router.get("/", authMiddleware, allowRoles("admin"), getItems);
router.get("/:id", authMiddleware, allowRoles("admin"), getItemById);
router.put("/:id", authMiddleware, allowRoles("admin"), updateItem);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteItem);

export default router;
