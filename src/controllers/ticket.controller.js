import db from "../config/db.js";
import {
  createTicket,
  deleteTicket,
  getTicket,
  getUsersTicket,
  updateTicket,
} from "../models/ticket.models.js";

const getUserTicketController = async (req, res) => {
  try {
    const email = req.query?.email;
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
    const ticketID = req.params.id;
    const ticketDetails = await getTicket(ticketID);
    if (ticketDetails.length === 0) {
      return res.status(404).json({
        message: "Ticket not found.",
      });
    }
    res.status(200).json({ message: "successful", ticketDetails });
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
};

const createTicketController = async (req, res) => {
  try {
    const { email, ticketDetails, ticketPrority, department } = req.body;
    if (!email || !ticketDetails || !ticketPrority || !department) {
      console.log("missong field");
      return res.status(400).end("Bad Request:Must contain all fields.");
    }
    const result = await createTicket(
      ticketDetails,
      ticketPrority,
      email,
      department,
    );
    res.status(200).json({ message: "successfully inserted", result: result });
  } catch (e) {
    console.error(e);
    res.status(500).end("Somne Internal error ");
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
    const email = req.query?.email;

    if (!id) {
      return res.status(400).json({ message: "Ticket id is required." });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Required fileds for update" });
    }

    const result = await updateTicket(id, updates, email);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Ticket not while updating found.",
      });
    }
    res.status(200).json({
      message: "Ticket updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error.",
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
