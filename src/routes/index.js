import { Router } from "express";
import organizationRoutes from "./organization.routes.js";
import branchRoutes from "./branch.routes.js";
import categoryRoutes from "./category.routes.js";
import itemRoutes from "./item.routes.js";
import menuRoutes from "./menu.routes.js";
import bundleRoutes from "./bundle.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

// Example route groups
router.get("/", (req, res) => {
  res.send("API Running...");
});
router.use("/auth", authRoutes);
router.use("/organizations", organizationRoutes);
router.use("/branches", branchRoutes);
router.use("/categories", categoryRoutes);
router.use("/items", itemRoutes);
router.use("/menus", menuRoutes);
router.use("/bundles", bundleRoutes);
// import authRoutes from "./auth.routes.js";  
// you add this
// router.use("/auth", authRoutes);

export default router;
