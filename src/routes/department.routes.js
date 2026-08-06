import express from "express";
import {
  createDepartmentController,
  deleteDepartmentController,
  getAllDepartmentController,
  getDepartmentController,
  updateDepartmentController,
} from "../controllers/department.controller.js";
import { isAdmin } from "../middleware/auth.middleware.js";
const router = express.Router();

router.get("/", getAllDepartmentController);
router.get("/:id", getDepartmentController);
router.post("/", isAdmin, createDepartmentController);
router.patch("/:id", isAdmin, updateDepartmentController);
router.delete("/:id", isAdmin, deleteDepartmentController);

export default router;
