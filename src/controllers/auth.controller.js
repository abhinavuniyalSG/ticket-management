import { createUser, selectUser } from "../models/auth.models.js";
import {
  generateHashPassword,
  tokenGenerator,
  verifypaswword,
} from "../utils/auth.utils.js";

export const registerController = async (req, res) => {
  try {
    const email = req.body?.email;
    const password = req.body?.password;
    const name = req.body?.name;
    if (email === undefined || password === undefined || name === undefined) {
      res
        .status(400)
        .end("Bad Request:Must contain both name, email and password");
    }
    const hashedPasswored = await generateHashPassword(password);
    const result = await createUser(name, email, hashedPasswored);
    const payload = { email: req.body.email };
    const token = tokenGenerator(payload, "1h");
    res.status(200).json({ message: "User Registered", token: token });
  } catch (e) {
    res.status(500).json("Failed to create user");
  }
};

export const loginController = async (req, res) => {
  try {
    const email = req.body?.email;
    const password = req.body?.password;
    if (email === undefined || password === undefined) {
      res
        .status(400)
        .end("Bad Request:Must contain both name, email and password");
    }
    const user = await selectUser(email);
    const isMatch = verifypaswword(password, user.user_password);
    if (!isMatch) {
      res.status(401).end("enter correct email or password");
    }
    const secret = process.env.JWT_SECRET;
    const payload = { email: email };
    const token = tokenGenerator(payload, "1h");
    res.status(200).json({ message: "User successfully Login", token: token });
  } catch (e) {
    console.error(e);
    res.status(500).json("Failed to create login user");
  }
};
