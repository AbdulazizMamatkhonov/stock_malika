import jwt from "jsonwebtoken";

export type JwtPayload = {
  sub: string;
  tenantId?: string;
  role: string;
};

const accessSecret = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, accessSecret, { expiresIn: "15m" });

export const signRefreshToken = (payload: JwtPayload) =>
  jwt.sign(payload, refreshSecret, { expiresIn: "7d" });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, accessSecret) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, refreshSecret) as JwtPayload;
