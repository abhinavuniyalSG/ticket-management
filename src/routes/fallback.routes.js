import express from "express";
import { fallbackController } from "../controllers/fallback.controller.js";

const router = express.Router();

router.use(fallbackController);

export default router;
