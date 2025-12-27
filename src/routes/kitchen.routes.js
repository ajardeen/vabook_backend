import { Router } from "express";
import {
  getKitchenTasks,
  updateKitchenStatus
} from "../controllers/kitchen.controller.js";

const router = Router();

// Kitchen Display Screen
router.get("/", getKitchenTasks);

// Update Kitchen Task Status
router.put("/status/:id", updateKitchenStatus);

export default router;
