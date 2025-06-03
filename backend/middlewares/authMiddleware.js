import jwt from "jsonwebtoken";

export const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  jwt.verify(token, "JWT_SNEAKPEEK_SECRET", (err, decoded) => {
    if (err)
      return res.status(403).json({ success: false, message: "Unauthorized" });

    req.user = decoded;
    next();
  });
};
