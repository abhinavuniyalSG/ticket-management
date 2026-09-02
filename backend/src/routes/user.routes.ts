import express from "express";
import { UserController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/authentication.middleware.js";
import { requireVerifiedEmail } from "../middleware/emailVerification.middleware.js";
import { requestValidator } from "../middleware/requestValidator.middleware.js";
import { UserSchema } from "../validationSchema/user.schema.js";

class UserRoutes {
  public router = express.Router();
  private validator = requestValidator.validate;
  private requestSchema = new UserSchema();

  private initialize = () => {
    this.router.use(authMiddleware, requireVerifiedEmail);

    this.router.get("/", UserController.getAllUsersController);

    // Contact routes for authenticated user
    this.router.post(
      "/contacts",
      this.validator("body", this.requestSchema.addContactSchema),
      UserController.addContactController,
    );

    this.router.patch(
      "/contacts/:contactId",
      this.validator("params", this.requestSchema.contactIdParamSchema),
      this.validator("body", this.requestSchema.updateContactSchema),
      UserController.updateContactController,
    );

    this.router.delete(
      "/contacts/:contactId",
      this.validator("params", this.requestSchema.contactIdParamSchema),
      UserController.deleteContactController,
    );

    this.router.get(
      "/:id",
      this.validator("params", this.requestSchema.userIdParamSchema),
      UserController.getUserDetailsController,
    );

    this.router.patch(
      "/:id",
      this.validator("params", this.requestSchema.userIdParamSchema),
      this.validator("body", this.requestSchema.updateUserSchema),
      UserController.updateUserController,
    );

    this.router.delete(
      "/:id",
      this.validator("params", this.requestSchema.userIdParamSchema),
      UserController.deleteUserController,
    );
  };

  constructor() {
    this.initialize();
  }
}

export default new UserRoutes().router;
