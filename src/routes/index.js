import { Router } from "express";
import organizationRoutes from "./organization.routes.js";
const router = Router();

// Example route groups
router.get("/", (req, res) => {
  res.send("API Running...");
});
router.use("/organizations", organizationRoutes);
// import authRoutes from "./auth.routes.js";  
// you add this
// router.use("/auth", authRoutes);

export default router;
