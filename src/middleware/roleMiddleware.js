const allowRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    //   console.log("roles",req.user.role);
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
};

export default allowRoles;