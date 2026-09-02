import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import { LOGGER_VARIABLES } from "../config/secrets.js";

const isProduction = LOGGER_VARIABLES.NODE_ENV === "PRODUCTION";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
};

const getTokenMaxAge = (token: string): number | undefined => {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    return undefined;
  }
  const maxAge = decoded.exp * 1000 - Date.now();
  return maxAge > 0 ? maxAge : undefined;
};

const cookieOptionsFor = (token: string): CookieOptions => {
  const maxAge = getTokenMaxAge(token);
  return maxAge === undefined
    ? { ...baseCookieOptions }
    : { ...baseCookieOptions, maxAge };
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie("accessToken", accessToken, cookieOptionsFor(accessToken));
  res.cookie("refreshToken", refreshToken, cookieOptionsFor(refreshToken));
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
};
