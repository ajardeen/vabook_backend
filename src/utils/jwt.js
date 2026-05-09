import jwt from "jsonwebtoken";

export const generateToken = (account) => {
  console.log("Generating token for account");
  
  return jwt.sign(
    {
      id: account._id,
      organizationId: account.organizationId,
      role: account.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE },
  );
};

export const verifyToken = (token) => {
    console.log("verfiyinf token for account");
  
  return jwt.verify(token, process.env.JWT_SECRET);
};
