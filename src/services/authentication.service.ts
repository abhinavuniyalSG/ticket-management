import { logger } from "../core/logger.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_VARIABLES } from "../config/secrets.js";
import { HttpError } from "../utils/httpError.utils.js";
import {
  generateHashPassword,
  generateTokenHash,
  tokenGenerator,
  verifyHashPassword,
  verifyToken,
  verifyTokenHash,
} from "../utils/auth.util.js";
import { UserRepository } from "../database/repositry/user.repository.js";

export interface RegisterInput extends LoginInput {
  firstName: string;
  lastName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthenticationService {
  public static register = async (userDetails: RegisterInput) => {
    const existingUser = await UserRepository.findByEmail(userDetails.email);

    if (existingUser) {
      throw new HttpError(409, "User already exists");
    }

    const hashedPassword = await generateHashPassword(userDetails.password);

    const user = await UserRepository.createUser({
      ...userDetails,
      password: hashedPassword,
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
      ...userWithoutSensitiveData
    } = user as any;

    logger.info("User registered successfully", {
      userId: user.id,
      email: user.email,
    });

    return {
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: userWithoutSensitiveData,
    };
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
}
