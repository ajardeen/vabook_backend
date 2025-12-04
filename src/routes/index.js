import { Router } from "express";
import organizationRoutes from "./organization.routes.js";
import branchRoutes from "./branch.routes.js";
import categoryRoutes from "./category.routes.js";
import itemRoutes from "./item.routes.js";
import menuRoutes from "./menu.routes.js";
import bundleRoutes from "./bundle.routes.js";
import authRoutes from "./auth.routes.js";
import customerRoutes from "./customer.routes.js";
import orderRoutes from "./order.routes.js";
import kitchenRoutes from "./kitchen.routes.js";
import staffRoutes from "./staff.routes.js";

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
router.use("/customers", customerRoutes);
router.use("/orders", orderRoutes);
router.use("/kitchen", kitchenRoutes);
router.use("/staff", staffRoutes)
// import authRoutes from "./auth.routes.js";  
// you add this
// router.use("/auth", authRoutes);

export default router;
