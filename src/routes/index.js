import { Router } from "express";
import organizationRoutes from "./organization.routes.js";
import branchRoutes from "./branch.routes.js";
const router = Router();

// Example route groups
router.get("/", (req, res) => {
  res.send("API Running...");
});
router.use("/organizations", organizationRoutes);
router.use("/branches", branchRoutes);
// import authRoutes from "./auth.routes.js";  
// you add this
// router.use("/auth", authRoutes);

export default router;
