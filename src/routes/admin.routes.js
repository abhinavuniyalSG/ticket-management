import express from "express";
import {
  deleteUserDetailController,
  getAllTicketController,
  getAllUserConteroller,
  getUserDetail,
  updateTicketByAdminController,
  updateUserDetailController,
} from "../controllers/admin.controller.js";
const router = express.Router();

router.get("/ticket", getAllTicketController);
router.patch("/ticket/:id", updateTicketByAdminController);
router.get("/user", getAllUserConteroller);
router.get("/user/:email", getUserDetail);
router.patch("/user/:email", updateUserDetailController);
router.delete("/user/:email", deleteUserDetailController);
export default router;
