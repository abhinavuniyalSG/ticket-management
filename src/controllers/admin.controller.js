import {
  deleteUserDetail,
  getAllTickets,
  getAllUsers,
  getUserDetailByEmail,
  updateTicketByAdmin,
  updateUserDetail,
} from "../services/admin.service.js";

const getAllTicketController = async (req, res) => {
  try {
    const tickets = await getAllTickets(req.query);
    return res.status(200).json({
      message: "Tickets fetched successfully.",
      tickets,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
};
const updateTicketByAdminController = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Ticket id is required.",
      });
    }

    await updateTicketByAdmin(id, updates);

    return res.status(200).json({
      message: "Ticket updated successfully.",
    });
  } catch (e) {
    console.error(e);
    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};
const getAllUserConteroller = async (req, res) => {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      message: "Users fetched successfully.",
      users,
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};

const getUserDetail = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await getUserDetailByEmail(email);

    return res.status(200).json({
      message: "User fetched successfully.",
      user,
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};
const updateUserDetailController = async (req, res) => {
  try {
    const { email } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No fields provided to update.",
      });
    }

    await updateUserDetail(email, updates);

    return res.status(200).json({
      message: "User updated successfully.",
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};
const deleteUserDetailController = async (req, res) => {
  try {
    const { email } = req.params;

    await deleteUserDetail(email);

    return res.status(200).json({
      message: "User deleted successfully.",
    });
  } catch (e) {
    console.error(e);

    return res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};
export {
  getAllTicketController,
  updateTicketByAdminController,
  getAllUserConteroller,
  getUserDetail,
  updateUserDetailController,
  deleteUserDetailController,
};
