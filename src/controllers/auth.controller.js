import { createUser, selectUser } from "../models/auth.model.js";
import {
  generateHashPassword,
  tokenGenerator,
  verifypaswword,
} from "../utils/auth.util.js";

export const registerController = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (email === undefined || password === undefined || name === undefined) {
      return res.status(400).json({
        message: "Bad Request:Must contain name, email and password",
      });
    }

    const hashedPasswored = await generateHashPassword(password);
    const result = await createUser(name, email, hashedPasswored);
    const payload = { email: req.body.email };
    const token = tokenGenerator(payload, "1h");
    res.status(201).json({ message: "User Registered", token: token });
  } catch (e) {
    console.error(e);
    res
      .status(e.status || 500)
      .json({ message: e.message || "Internal error: Failed to create user" });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === undefined || password === undefined) {
      return res
        .status(400)
        .end("Bad Request:Must contain both name, email and password");
    }
    const user = await selectUser(email);
    const isMatch = await verifypaswword(password, user.user_password);
    if (!isMatch) {
      return res.status(401).end("enter correct email or password");
    }
    const secret = process.env.JWT_SECRET;
    const payload = { email: email };
    const token = tokenGenerator(payload, "1h");
    res.status(200).json({ message: "User successfully Login", token: token });
  } catch (e) {
    console.error(e);
    res
      .status(e.status || 500)
      .json({ message: e.message || "Failed to login user" });
  }
};
