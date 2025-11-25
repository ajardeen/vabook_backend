import jwt from "jsonwebtoken";

export const generateToken = (account) => {
  return jwt.sign(
    { id: account._id, organizationId: account.organizationId, role: account.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
