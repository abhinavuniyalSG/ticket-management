import express from "express";
import { DepartmentController } from "../controllers/department.controller.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { requireVerifiedEmail } from "../middleware/emailVerification.middleware.js";
import { requestValidator } from "../middleware/requestValidator.middleware.js";
import { DepartmentSchema } from "../validationSchema/department.schema.js";

class DepartmentRoutes {
  public router = express.Router();
  private validator = requestValidator.validate;
  private requestSchema = new DepartmentSchema();

  private initialize = () => {
    this.router.use(authMiddleware, requireVerifiedEmail);

    this.router.get(
      "/",
      this.validator("query", this.requestSchema.departmentQuerySchema),
      DepartmentController.getAllDepartmentsController,
    );

    this.router.get(
      "/:id",
      this.validator("params", this.requestSchema.departmentIdParamSchema),
      DepartmentController.getDepartmentDetailsController,
    );

    this.router.post(
      "/",
      this.validator("body", this.requestSchema.createDepartmentSchema),
      DepartmentController.createDepartmentController,
    );

    this.router.patch(
      "/:id",
      this.validator("params", this.requestSchema.departmentIdParamSchema),
      this.validator("body", this.requestSchema.updateDepartmentSchema),
      DepartmentController.updateDepartmentController,
    );

    this.router.delete(
      "/:id",
      this.validator("params", this.requestSchema.departmentIdParamSchema),
      DepartmentController.deleteDepartmentController,
    );
  };

  constructor() {
    this.initialize();
  }
}

export default new DepartmentRoutes().router;
