import { getUserByEmail } from "../models/user.models.js";

const getUserDetailController = async (req, res) => {
  try {
    const email = req.user.email;
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }
    return res.status(200).json({
      message: "User details fetched successfully.",
      user,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};

export { getUserDetailController };
