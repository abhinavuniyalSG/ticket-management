import { getUserByEmail } from "../services/user.service.js";

const getUserDetailController = async (req, res, next) => {
  try {
    const email = req.user.email;
    const user = await getUserByEmail(email);

    return res.status(200).json({
      message: "User details fetched successfully.",
      user,
    });
  } catch (e) {
    return next(e);
  }
};

export { getUserDetailController };
