import { tokenGenerator } from "../utils/auth.utils.js";

export const registerController = (req, res) => {
  const secret = process.env.JWT_SECRET;
  const payload = { email: req.body.email };
  const token = tokenGenerator(secret, payload, "15m");
  console.log("register user : ", token);
  res.status(200).json({ message: "User Registered", token: token });
};

export const loginController = (req, res) => {
  const secret = process.env.JWT_SECRET;
  const payload = { email: req.body.email };
  const token = tokenGenerator(secret, payload, "15m");
  res.status(200).json({ message: "hello login", token: token });
};
