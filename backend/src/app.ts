import "dotenv/config";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, type User, type UserRole, type UserStatus } from "@prisma/client";

export type AuthUser = {
  userId: string;
  companyId: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  name: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "flowforge_session";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

export const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

function createToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.userId,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      status: user.status,
      name: user.name,
    },
    JWT_SECRET as jwt.Secret,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

function sanitizeUser(user: Pick<User, "id" | "name" | "email" | "companyId" | "role" | "status">) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    companyId: user.companyId,
    role: user.role,
    status: user.status,
  };
}

export function getAuthenticatedUserFromToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as {
    sub: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    companyId: string;
    name: string;
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = getAuthenticatedUserFromToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      clearAuthCookie(res);
      return res.status(401).json({ message: "Your account is inactive or your session is invalid." });
    }

    req.user = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      status: user.status,
      email: user.email,
      name: user.name,
    };

    return next();
  } catch (_error) {
    clearAuthCookie(res);
    return res.status(401).json({ message: "Your session is invalid or has expired." });
  }
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/register", async (req, res) => {
  const companyName = String(req.body?.companyName ?? "").trim();
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ message: "Company name, your name, email, and password are required." });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address." });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
        },
      });

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "ADMIN",
          status: "ACTIVE",
          companyId: company.id,
        },
      });

      const updatedCompany = await tx.company.update({
        where: { id: company.id },
        data: { createdBy: user.id },
      });

      return { company: updatedCompany, user };
    });

    const authUser: AuthUser = {
      userId: result.user.id,
      companyId: result.user.companyId,
      role: result.user.role,
      status: result.user.status,
      email: result.user.email,
      name: result.user.name,
    };

    const token = createToken(authUser);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Organization created successfully.",
      user: sanitizeUser(result.user),
      company: { id: result.company.id, name: result.company.name },
    });
  } catch (error) {
    console.error("Register organization error:", error);
    return res.status(500).json({ message: "Unable to create the organization right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.status !== "ACTIVE") {
      return res.status(401).json({ message: "Your account is inactive." });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const authUser: AuthUser = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      status: user.status,
      email: user.email,
      name: user.name,
    };

    const token = createToken(authUser);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Login successful.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to log in right now." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out successfully." });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      companyId: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ message: "User not found." });
  }

  return res.status(200).json({ user: sanitizeUser(user) });
});

export { prisma };
