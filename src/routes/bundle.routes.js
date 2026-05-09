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
import authMiddleware from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = Router();

router.post(
  "/",
  upload.single("img"),
  authMiddleware,
  allowRoles("admin"),
  createBundle,
);
router.get("/", authMiddleware, allowRoles("admin"), getBundles);
// exposed to external services
router.get(
  "/published",
  authMiddleware,
  allowRoles("admin", "customer"),
  getPublishedBundles,
);
router.get(
  "/:id",
  authMiddleware,
  allowRoles("admin", "customer"),
  getBundleById,
);
router.put(
  "/:id",
  authMiddleware,
  allowRoles("admin"),
  upload.single("img"),
  updateBundle,
);
router.delete("/:id", authMiddleware, allowRoles("admin"), deleteBundle);

export default router;
