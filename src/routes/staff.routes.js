import express from "express";
import {
  getAllStaff,
  createStaff,
  updateStaff,
  suspendStaff,
  deleteStaff,
} from "../controllers/staff.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, allowRoles("admin"), getAllStaff);
router.post("/", authMiddleware, allowRoles("admin"), createStaff);
router.put("/:id", authMiddleware, allowRoles("admin"), updateStaff);
router.put("/:id/suspend", authMiddleware, allowRoles("admin"), suspendStaff);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteStaff);

export default router;
