import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/auth.utils.js";
import { getUserByEmail } from "../models/user.models.js";
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

const isAdmin = async (req, res, next) => {
  try {
    const email = req.user?.email;

    if (!email) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.user_role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }
    next();
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export { jwtAuthenticate, isAdmin };
