import Account from "../models/Account.model.js";

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: missing account",
      });
    }

    const account = await Account.findById(req.user.id);

    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Account not found",
      });
    }

    if (account.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    if (account.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // attach full account for controllers
    req.account = account;

    next();
  } catch (err) {
    next(err);
  }
};
