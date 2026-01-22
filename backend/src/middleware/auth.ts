import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth";

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    tenantId?: string;
    role: string;
  };
}

export const requireAuth = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const payload = verifyAccessToken(authHeader.replace("Bearer ", ""));
    req.user = {
      id: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole = (roles: string[]) =>
  (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
