import express from "express";
import { getUserDetailController } from "../controllers/user.controller";
const router = express.router();

router("/", getUserDetailController);

export default router;
