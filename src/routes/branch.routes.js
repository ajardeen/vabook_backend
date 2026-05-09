import { Router } from "express";
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "../controllers/branch.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = Router();

router.post("/", createBranch);
router.get("/", getBranches);
router.get("/:id", getBranchById);
router.put("/:id", authMiddleware, allowRoles("admin"), updateBranch);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteBranch);

export default router;
