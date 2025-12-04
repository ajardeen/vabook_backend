import express from "express";
import {
  getAllStaff,
  createStaff,
  updateStaff,
  suspendStaff,
  deleteStaff,
} from "../controllers/staff.controller.js";

const router = express.Router();

router.get("/", getAllStaff);
router.post("/", createStaff);
router.put("/:id", updateStaff);
router.put("/:id/suspend", suspendStaff);
router.delete("/:id", deleteStaff);

export default router;
