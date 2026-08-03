import express from "express";
import { getStatus } from "../controllers/server.controller.js";
const router = express.Router();

router.get("/", getStatus);
export default router;
