import db from "../config/db.js";
import {
  createTicket,
  deleteTicket,
  getTicket,
  getUsersTicket,
  updateTicket,
} from "../models/ticket.model.js";

const getUserTicketController = async (req, res) => {
  try {
    const email = req.user.email;
    const way = req.query?.way?.toLowerCase();
    if (!email) {
      return res.status(400).end("Required email");
    }
    const tickets = await getUsersTicket(email, way);
    res.status(200).json({ message: "Tasks list of the user", tickets });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Internal server error.",
    });
  }
};

const getTicketController = async (req, res) => {
  try {
    const email = req.user.email;
    const ticketID = req.params.id;
    const ticketDetails = await getTicket(ticketID, email);
    res.status(200).json({ message: "successful", ticketDetails });
  } catch (e) {
    console.error(e);
    res
      .status(e.status || 500)
      .json({ message: e.message || "Internal server error." });
  }
};

const createTicketController = async (req, res) => {
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
    console.error(e);
    res.status(500).json({ message: "Somne Internal error " });
  }
};
const deleteTicketController = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTicket(id);
    res.status(200).json({
      message: "Ticket deleted successfully.",
    });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};
const updateTicketController = async (req, res) => {
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
    console.error(e);
    res.status(e.status || 500).json({
      message: e.message || "Internal server error.",
    });
  }
};

export {
  getUserTicketController,
  getTicketController,
  createTicketController,
  deleteTicketController,
  updateTicketController,
};
