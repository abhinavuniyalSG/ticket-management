import { logger } from "../core/logger.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { APP_VARIABLES, JWT_VARIABLES } from "../config/secrets.js";
import { HttpError } from "../utils/httpError.utils.js";
import {
  generateHashPassword,
  generateRandomToken,
  generateTokenHash,
  tokenGenerator,
  verifyHashPassword,
  verifyToken,
  verifyTokenHash,
} from "../utils/auth.util.js";
import { UserRepository } from "../database/repositry/user.repository.js";
import { EmailService } from "./email.service.js";

export interface RegisterInput extends LoginInput {
  firstName: string;
  lastName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export class AuthenticationService {
  private static sendVerificationEmail = async (
    email: string,
    verificationToken: string,
  ) => {
    const verificationLink = `${APP_VARIABLES.APP_URL}/api/auth/verify-email/${verificationToken}`;
    await EmailService.send({
      to: email,
      subject: "Verify your email address",
      text: `Welcome! Please verify your email by visiting the following link: ${verificationLink}\n\nThis link will expire in 24 hours.`,
      html: `<p>Welcome! Please verify your email address by clicking the link below.</p><p><a href="${verificationLink}">Verify Email</a></p><p>This link will expire in 24 hours.</p>`,
    });
  };

  public static register = async (userDetails: RegisterInput) => {
    const existingUser = await UserRepository.findByEmail(userDetails.email);

    if (existingUser) {
      throw new HttpError(409, "User already exists");
    }

    const hashedPassword = await generateHashPassword(userDetails.password);

    const verificationToken = generateRandomToken();
    const verificationTokenHash = generateTokenHash(verificationToken);
    const verificationTokenExpires = new Date(
      Date.now() + APP_VARIABLES.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MS,
    );

    const user = await UserRepository.createUser({
      ...userDetails,
      password: hashedPassword,
      verificationToken: verificationTokenHash,
      verificationTokenExpires,
    });

    const accessToken = tokenGenerator(
      { id: user.id, email: user.email, role: user.role },
      "ACCESS",
    );

    const refreshToken = tokenGenerator(
      { id: user.id, email: user.email, role: user.role },
      "REFRESH",
    );
    const safeRefreshToken = generateTokenHash(refreshToken);
    await UserRepository.updateRefreshToken(user.id, safeRefreshToken);

    const {
      password,
      refreshToken: _,
      verificationToken: __,
      verificationTokenExpires: ___,
      ...userWithoutSensitiveData
    } = user as any;

    await AuthenticationService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    logger.info("User registered successfully", {
      userId: user.id,
      email: user.email,
    });

    return {
      message:
        "User registered successfully. Please check your email to verify your account.",
      accessToken,
      refreshToken,
      user: userWithoutSensitiveData,
    };
  };

  public static verifyEmail = async (token: string) => {
    if (!token) {
      throw new HttpError(400, "Verification token is required");
    }

    const tokenHash = generateTokenHash(token);
    const user = await UserRepository.findByVerificationTokenHash(tokenHash);

    if (!user) {
      throw new HttpError(400, "Invalid or expired verification token");
    }

    if (user.isVerified) {
      return { message: "Email already verified" };
    }

    if (
      !user.verificationTokenExpires ||
      user.verificationTokenExpires.getTime() < Date.now()
    ) {
      throw new HttpError(400, "Verification token has expired");
    }

    await UserRepository.markEmailVerified(user.id);

    logger.info("User verified email successfully", {
      userId: user.id,
      email: user.email,
    });

    return { message: "Email verified successfully" };
  };

  public static resendVerification = async (email: string) => {
    const genericResponse = {
      message:
        "If an account with that email exists, a verification email has been sent",
    };

    const user = await UserRepository.findByEmail(email);

    if (!user) {
      return genericResponse;
    }

    if (user.isVerified) {
      return { message: "Email already verified" };
    }

    const verificationToken = generateRandomToken();
    const verificationTokenHash = generateTokenHash(verificationToken);
    const verificationTokenExpires = new Date(
      Date.now() + APP_VARIABLES.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_MS,
    );

    await UserRepository.setVerificationToken(
      user.id,
      verificationTokenHash,
      verificationTokenExpires,
    );

    await AuthenticationService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    logger.info("Resent verification email", {
      userId: user.id,
      email: user.email,
    });

    return genericResponse;
  };

  public static login = async (loginInput: LoginInput) => {
    const user = await UserRepository.findByEmail(loginInput.email);

    if (!user) {
      throw new HttpError(401, "Invalid email or password");
    }

    const isPasswordValid = await verifyHashPassword(
      loginInput.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid email or password");
    }

    const accessToken = tokenGenerator(
      { id: user.id, email: user.email, role: user.role },
      "ACCESS",
    );

    const refreshToken = tokenGenerator(
      { id: user.id, email: user.email, role: user.role },
      "REFRESH",
    );
    const safeRefreshToken = generateTokenHash(refreshToken);
    await UserRepository.updateRefreshToken(user.id, safeRefreshToken);

    const { password, refreshToken: _, ...userWithoutSensitiveData } = user;

    logger.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
    });

    return {
      message: "Login successful",
      accessToken,
      refreshToken,
      user: userWithoutSensitiveData,
    };
  };

  public static refresh = async (token: string) => {
    let decoded: any;
    try {
      decoded = verifyToken(token, JWT_VARIABLES.JWT_REFRESH_SECRET);
      if (!decoded?.id || decoded?.typ !== "refresh") {
        throw new HttpError(401, "Invalid refresh token payload");
      }
      const user = await UserRepository.findByIdWithRefreshToken(decoded.id);

      const isVlaidRefreshtoken = verifyTokenHash(
        token,
        user?.refreshToken ?? "",
      );
      if (!user || !isVlaidRefreshtoken) {
        throw new HttpError(401, "Invalid refresh token");
      }
      const accessToken = tokenGenerator(
        { id: user.id, email: user.email, role: user.role },
        "ACCESS",
      );

      const refreshToken = tokenGenerator(
        { id: user.id, email: user.email, role: user.role },
        "REFRESH",
      );
      const safeRefreshToken = generateTokenHash(refreshToken);

      await UserRepository.updateRefreshToken(user.id, safeRefreshToken);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(401, "Invalid or expired refresh token");
    }
  };

  public static logout = async (userId: string) => {
    await UserRepository.updateRefreshToken(userId, null);
    logger.info("User logged out successfully", { userId });
    return {
      message: "Logout successful",
    };
  };

  public static changePassword = async (input: ChangePasswordInput) => {
    const user = await UserRepository.findByEmail(input.email);

    if (!user) {
      throw new HttpError(401, "Invalid email or old password");
    }

    const isOldPasswordValid = await verifyHashPassword(
      input.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new HttpError(401, "Invalid email or old password");
    }

    const hashedPassword = await generateHashPassword(input.newPassword);
    await UserRepository.updatePassword(user.id, hashedPassword);

    // Invalidate the existing refresh token so other sessions must re-authenticate.
    await UserRepository.updateRefreshToken(user.id, null);

    logger.info("User changed password successfully", { userId: user.id });

    return {
      message: "Password changed successfully",
    };
  };
}
