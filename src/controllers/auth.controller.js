import { login, register } from "../services/auth.service.js";

export const registerController = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (email === undefined || password === undefined || name === undefined) {
      return res.status(400).json({
        message: "Bad Request:Must contain name, email and password",
      });
    }

    const token = await register(name, email, password);
    res.status(201).json({ message: "User Registered", token: token });
  } catch (e) {
    return next(e);
  }
};

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (email === undefined || password === undefined) {
      return res
        .status(400)
        .end("Bad Request:Must contain both name, email and password");
    }
    const token = await login(email, password);
    if (!token) {
      return res.status(401).end("enter correct email or password");
    }
    res.status(200).json({ message: "User successfully Login", token: token });
  } catch (e) {
    return next(e);
  }
};
