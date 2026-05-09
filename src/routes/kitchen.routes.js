import { Router } from "express";
import {
  getKitchenTasks,
  updateKitchenStatus,
} from "../controllers/kitchen.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = Router();

// Kitchen Display Screen
router.get("/", authMiddleware, allowRoles("admin", "chef"), getKitchenTasks);

// Update Kitchen Task Status
router.put(
  "/status/:id",
  authMiddleware,
  allowRoles("admin", "chef"),
  updateKitchenStatus,
);

export default router;
