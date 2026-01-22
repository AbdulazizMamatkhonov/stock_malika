import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../lib/auth";
import { loginSchema } from "../../shared/src";
import { User } from "../models/User";

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email }).lean();
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = signAccessToken({
    sub: user._id.toString(),
    tenantId: user.tenantId?.toString(),
    role: user.role
  });
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    tenantId: user.tenantId?.toString(),
    role: user.role
  });

  return res.json({ accessToken, refreshToken });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    return res.status(400).json({ message: "Missing refresh token" });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({
      sub: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role
    });
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  return res.json({ message: "Logged out" });
};
