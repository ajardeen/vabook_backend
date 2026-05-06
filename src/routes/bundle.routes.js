import { Router } from "express";
import {
  createBundle,
  getBundles,
  getBundleById,
  updateBundle,
  deleteBundle,
  getPublishedBundles,
} from "../controllers/bundle.controller.js";
import { upload } from "../middleware/multer.js";

const router = Router();

router.post("/", upload.single("img"), createBundle);
router.get("/", getBundles);
// exposed to external services
router.get("/published", getPublishedBundles);
router.get("/:id", getBundleById);
router.put("/:id", upload.single("img"), updateBundle);
router.delete("/:id", deleteBundle);

export default router;
