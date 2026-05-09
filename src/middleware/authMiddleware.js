import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  // console.log("authMiddleware verifing token");
  
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * Example decoded token:
     * {
     *   id: "...",
     *   role: "admin",
     *   model: "Account"
     * }
     */

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

export default authMiddleware;