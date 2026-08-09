import { getUserByEmail } from "../services/user.service.js";

const getUserDetailController = async (req, res) => {
  try {
    const email = req.user.email;
    const user = await getUserByEmail(email);

    return res.status(200).json({
      message: "User details fetched successfully.",
      user,
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};

export { getUserDetailController };
