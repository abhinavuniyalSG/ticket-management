import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/auth.utils.js";
const jwtAuthenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Access token required.",
    });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid token.",
    });
  }
};
export { jwtAuthenticate };
