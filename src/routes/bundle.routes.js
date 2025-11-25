import { Router } from "express";
import {
  createBundle,
  getBundles,
  getBundleById,
  updateBundle,
  deleteBundle,
  getPublishedBundles,
} from "../controllers/bundle.controller.js";

const router = Router();

router.post("/", createBundle);
router.get("/", getBundles);
// exposed to external services 
router.get("/published", getPublishedBundles);
router.get("/:id", getBundleById);
router.put("/:id", updateBundle);
router.delete("/:id", deleteBundle);


export default router;
