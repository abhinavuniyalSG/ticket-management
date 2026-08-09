import {
  createTicket,
  deleteTicket,
  getTicket,
  getUsersTicket,
  updateTicket,
} from "../services/ticket.service.js";

const getUserTicketController = async (req, res, next) => {
  try {
    const email = req.user.email;
    const way = req.query?.way;
    if (!email) {
      return res.status(400).end("Required email");
    }
    const tickets = await getUsersTicket(email, way);
    res.status(200).json({ message: "Tasks list of the user", tickets });
  } catch (e) {
    return next(e);
  }
};

const getTicketController = async (req, res, next) => {
  try {
    const email = req.user.email;
    const ticketID = req.params.id;
    const ticketDetails = await getTicket(ticketID, email);
    res.status(200).json({ message: "successful", ticketDetails });
  } catch (e) {
    return next(e);
  }
};

const createTicketController = async (req, res, next) => {
  try {
    const { ticketDetails, ticketPrority, department } = req.body;
    const email = req.user.email;
    if (!email || !ticketDetails || !ticketPrority || !department) {
      console.error("missong field");
      return res
        .status(400)
        .json({ message: "Bad Request:Must contain all fields." });
    }
    const result = await createTicket(
      ticketDetails,
      ticketPrority,
      email,
      department,
    );

    res.status(201).json({ message: "successfully created" });
  } catch (e) {
    return next(e);
  }
};
const deleteTicketController = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteTicket(id);
    res.status(200).json({
      message: "Ticket deleted successfully.",
    });
  } catch (e) {
    return next(e);
  }
};
const updateTicketController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const email = req.user.email;

    if (!id) {
      return res.status(400).json({ message: "Ticket id is required." });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Required fields for update" });
    }

    const result = await updateTicket(id, updates, email);
    res.status(200).json({
      message: "Ticket updated successfully.",
    });
  } catch (e) {
    return next(e);
  }
};

export {
  getUserTicketController,
  getTicketController,
  createTicketController,
  deleteTicketController,
  updateTicketController,
};
