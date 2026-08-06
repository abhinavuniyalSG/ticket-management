import express from "express";
import {
  createTicketController,
  getUserTicketController,
  getTicketController,
  deleteTicketController,
  updateTicketController,
} from "../controllers/ticket.controller.js";

const router = express.Router();

router.get("/", getUserTicketController);
router.get("/:id", getTicketController);
router.post("/", createTicketController);
router.patch("/:id", updateTicketController);
router.delete("/:id", deleteTicketController);

export default router;
