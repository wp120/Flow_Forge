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
  department?: string | null;
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
      department: user.department ?? null,
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

function sanitizeUser(
  user: Pick<User, "id" | "name" | "email" | "companyId" | "role" | "status" | "department">,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    companyId: user.companyId,
    role: user.role,
    status: user.status,
    department: user.department ?? null,
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
    department?: string | null;
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
        department: true,
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
      department: user.department ?? null,
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
      department: true,
    },
  });

  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ message: "User not found." });
  }

  return res.status(200).json({ user: sanitizeUser(user) });
});

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      companyId: true,
      role: true,
      status: true,
      department: true,
    },
  });

  if (!currentUser || currentUser.status !== "ACTIVE") {
    return res.status(401).json({ message: "Your account is inactive or your session is invalid." });
  }

  if (currentUser.role !== "ADMIN") {
    return res.status(403).json({ message: "Administrator access required." });
  }

  req.user = {
    ...req.user,
    companyId: currentUser.companyId,
    role: currentUser.role,
    status: currentUser.status,
    department: currentUser.department ?? null,
  };

  return next();
}

function canUserApproveStep(
  user: { role: UserRole; userId: string; department?: string | null },
  step: { approvalJson?: unknown } | null | undefined,
) {
  if (!step?.approvalJson || typeof step.approvalJson !== "object") {
    return false;
  }

  const config = step.approvalJson as Record<string, unknown>;
  const type = String(config.type ?? config.kind ?? config.scope ?? "").toUpperCase();
  const value = String(config.value ?? config.target ?? config.name ?? "").trim();

  switch (type) {
    case "USER":
      return user.userId === value;
    case "ROLE":
      return user.role === value.toUpperCase() as UserRole;
    case "DEPARTMENT":
      return user.department === value;
    case "ADMIN":
      return user.role === "ADMIN";
    default:
      return false;
  }
}

app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { companyId: req.user!.companyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      department: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ users });
});

app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const role = String(req.body?.role ?? "USER") as UserRole;
  const status = String(req.body?.status ?? "ACTIVE") as UserStatus;
  const department = String(req.body?.department ?? "").trim() || null;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long." });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      status,
      department,
      companyId: req.user!.companyId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyId: true,
      role: true,
      status: true,
      department: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(201).json({ user: sanitizeUser(user) });
});

app.get("/api/admin/workflow-options", requireAuth, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { companyId: req.user!.companyId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, department: true },
  });

  return res.status(200).json({
    users,
    departments: [...new Set(users.map((user) => user.department).filter((department): department is string => Boolean(department)))].sort(),
    roles: ["ADMIN", "USER"],
  });
});

app.patch("/api/admin/users/:userId", requireAuth, requireAdmin, async (req, res) => {
  const targetUserId = String(req.params.userId ?? "");

  if (!targetUserId) {
    return res.status(400).json({ message: "A user id is required." });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, companyId: true },
  });

  if (!targetUser || targetUser.companyId !== req.user!.companyId) {
    return res.status(404).json({ message: "User not found in this company." });
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      name: typeof req.body?.name === "string" ? req.body.name.trim() || undefined : undefined,
      role: req.body?.role ? (String(req.body.role) as UserRole) : undefined,
      status: req.body?.status ? (String(req.body.status) as UserStatus) : undefined,
      department: req.body?.department === null ? null : typeof req.body?.department === "string" ? req.body.department.trim() || null : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyId: true,
      role: true,
      status: true,
      department: true,
      updatedAt: true,
    },
  });

  return res.status(200).json({ user: sanitizeUser(updatedUser) });
});

function getPagination(req: Request) {
  const requestedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  const requestedPageSize = Number.parseInt(String(req.query.pageSize ?? "10"), 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(100, Math.max(1, requestedPageSize))
    : 10;

  return { page, pageSize, skip: (page - 1) * pageSize };
}

app.get("/api/user/forms", requireAuth, async (req, res) => {
  if (req.user!.role !== "USER") {
    return res.status(403).json({ message: "This form listing is for regular users." });
  }

  const { page, pageSize, skip } = getPagination(req);
  const where = {
    companyId: req.user!.companyId,
    status: "PUBLISHED" as const,
    versions: { some: { status: "ACTIVE" as const } },
  };

  const [total, forms] = await Promise.all([
    prisma.form.count({ where }),
    prisma.form.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        versions: {
          where: { status: "ACTIVE" },
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: { workflow: { select: { name: true } } },
        },
      },
    }),
  ]);

  return res.status(200).json({
    forms: forms.map((form) => {
      const version = form.versions[0];
      const schema = version?.schemaJson;
      const fields = schema && typeof schema === "object" && !Array.isArray(schema) && Array.isArray((schema as { fields?: unknown }).fields)
        ? (schema as { fields: unknown[] }).fields.length
        : 0;

      return {
        id: form.id,
        name: form.name,
        description: form.description,
        versionId: version?.id,
        versionNumber: version?.versionNumber,
        workflow: version?.workflow.name ?? "",
        fields,
      };
    }),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

app.get("/api/user/forms/:formId", requireAuth, async (req, res) => {
  if (req.user!.role !== "USER") {
    return res.status(403).json({ message: "This form view is for regular users." });
  }

  const form = await prisma.form.findFirst({
    where: {
      id: String(req.params.formId ?? ""),
      companyId: req.user!.companyId,
      status: "PUBLISHED",
      versions: { some: { status: "ACTIVE" } },
    },
    include: {
      versions: {
        where: { status: "ACTIVE" },
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { workflow: { select: { name: true } } },
      },
    },
  });

  if (!form || !form.versions[0]) {
    return res.status(404).json({ message: "Published form not found." });
  }

  const version = form.versions[0];
  const schema = version.schemaJson;
  const fields = schema && typeof schema === "object" && !Array.isArray(schema) && Array.isArray((schema as { fields?: unknown }).fields)
    ? (schema as { fields: unknown[] }).fields
    : [];

  return res.status(200).json({
    form: {
      id: form.id,
      name: form.name,
      description: form.description,
      workflow: version.workflow.name,
      versionNumber: version.versionNumber,
      fields,
    },
  });
});

app.get("/api/user/forms/:formId/submissions", requireAuth, async (req, res) => {
  if (req.user!.role !== "USER") {
    return res.status(403).json({ message: "This submission listing is for regular users." });
  }

  const form = await prisma.form.findFirst({
    where: {
      id: String(req.params.formId ?? ""),
      companyId: req.user!.companyId,
      status: "PUBLISHED",
      versions: { some: { status: "ACTIVE" } },
    },
    select: { id: true, name: true },
  });

  if (!form) {
    return res.status(404).json({ message: "Published form not found." });
  }

  const { page, pageSize, skip } = getPagination(req);
  const where = {
    submittedBy: req.user!.userId,
    formVersion: { formId: form.id },
  };
  const [total, submissions] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip,
      take: pageSize,
      include: { currentStep: { select: { name: true } } },
    }),
  ]);

  return res.status(200).json({
    form,
    submissions: submissions.map((submission) => ({
      id: submission.id,
      status: submission.status,
      date: submission.submittedAt.toISOString(),
      step: submission.currentStep?.name ?? "Complete",
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

app.get("/api/my-submissions", requireAuth, async (req, res) => {
  if (req.user!.role !== "USER") {
    return res.status(403).json({ message: "This submission listing is for regular users." });
  }

  const { page, pageSize, skip } = getPagination(req);
  const where = {
    submittedBy: req.user!.userId,
    formVersion: { form: { companyId: req.user!.companyId } },
  };
  const [total, submissions] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        formVersion: { include: { form: { select: { name: true } } } },
        currentStep: { select: { name: true } },
      },
    }),
  ]);

  return res.status(200).json({
    requests: submissions.map((submission) => ({
      id: submission.id,
      form: submission.formVersion.form.name,
      submittedBy: req.user!.name,
      date: submission.submittedAt.toISOString(),
      status: submission.status,
      step: submission.currentStep?.name ?? "Complete",
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

app.get("/api/forms", requireAuth, requireAdmin, async (req, res) => {
  const forms = await prisma.form.findMany({
    where: { companyId: req.user!.companyId },
    orderBy: { updatedAt: "desc" },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
      },
    },
  });

  const payload = forms.flatMap((form) => {
    const draft = form.versions.find((version) => version.status === "DRAFT");
    const active = form.versions.find((version) => version.status === "ACTIVE");
    const versions = [draft, active, ...form.versions.filter((version) => version.status === "INACTIVE")].filter(Boolean);

    return versions.map((version) => {
      const schema = version!.schemaJson;
      const fields = schema && typeof schema === "object" && !Array.isArray(schema) && Array.isArray((schema as { fields?: unknown }).fields)
        ? (schema as { fields: unknown[] }).fields.length
        : 0;

      return {
        id: form.id,
        versionId: version!.id,
        versionNumber: version!.versionNumber,
        name: form.name,
        description: form.description,
        status: version!.status === "DRAFT" ? "DRAFT" : version!.status === "ACTIVE" ? "PUBLISHED" : "ARCHIVED",
        workflow: "Workflow linked",
        fields,
        editable: version!.status === "DRAFT",
      };
    });
  });

  return res.status(200).json({ forms: payload });
});

app.post("/api/forms", requireAuth, requireAdmin, async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const description = String(req.body?.description ?? "").trim();
  const workflowId = req.body?.workflowId ? String(req.body.workflowId) : null;

  if (!name) {
    return res.status(400).json({ message: "Form name is required." });
  }

  if (!workflowId) {
    return res.status(400).json({ message: "An associated workflow is required." });
  }

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, companyId: req.user!.companyId },
  });

  if (!workflow) {
    return res.status(404).json({ message: "Workflow not found." });
  }

  const fields = Array.isArray(req.body?.fields) ? req.body.fields : [];

  const form = await prisma.form.create({
    data: {
      companyId: req.user!.companyId,
      createdBy: req.user!.userId,
      name,
      description: description || null,
      status: "DRAFT",
      versions: {
        create: {
          versionNumber: 1,
          schemaJson: { fields },
          workflowId: workflow.id,
          status: "DRAFT",
          createdBy: req.user!.userId,
        },
      },
    },
    include: {
      versions: true,
    },
  });

  return res.status(201).json({ form });
});

app.get("/api/forms/:formId", requireAuth, requireAdmin, async (req, res) => {
  const requestedVersionId = typeof req.query.versionId === "string" ? req.query.versionId : null;
  const form = await prisma.form.findFirst({
    where: { id: String(req.params.formId ?? ""), companyId: req.user!.companyId },
    include: {
      versions: {
        where: requestedVersionId ? { id: requestedVersionId } : { status: "DRAFT" },
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: { workflow: { select: { id: true, name: true } } },
      },
    },
  });

  if (!form) {
    return res.status(404).json({ message: "Form not found." });
  }

  const draft = form.versions[0];
  return res.status(200).json({
    form: {
      id: form.id,
      name: form.name,
      description: form.description,
      workflowId: draft?.workflowId ?? null,
      fields: draft?.schemaJson && typeof draft.schemaJson === "object" && !Array.isArray(draft.schemaJson)
        ? (draft.schemaJson as { fields?: unknown[] }).fields ?? []
        : [],
    },
  });
});

app.patch("/api/forms/:formId", requireAuth, requireAdmin, async (req, res) => {
  const formId = String(req.params.formId ?? "");
  const name = String(req.body?.name ?? "").trim();
  const description = String(req.body?.description ?? "").trim();
  const workflowId = String(req.body?.workflowId ?? "").trim();
  const fields = Array.isArray(req.body?.fields) ? req.body.fields : [];

  if (!name || !workflowId) {
    return res.status(400).json({ message: "Form name and associated workflow are required." });
  }

  const form = await prisma.form.findFirst({
    where: { id: formId, companyId: req.user!.companyId },
  });
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, companyId: req.user!.companyId },
  });

  if (!form || !workflow) {
    return res.status(404).json({ message: "Form or workflow not found." });
  }

  const draft = await prisma.formVersion.findFirst({
    where: { formId, status: "DRAFT" },
    orderBy: { versionNumber: "desc" },
  });

  if (!draft) {
    return res.status(409).json({ message: "This form has no editable draft." });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.form.update({
      where: { id: formId },
      data: { name, description: description || null },
    });

    return tx.formVersion.update({
      where: { id: draft.id },
      data: {
        schemaJson: { fields },
        workflowId,
        updatedBy: req.user!.userId,
      },
    });
  });

  return res.status(200).json({ version: updated });
});

app.post("/api/forms/:formId/publish", requireAuth, requireAdmin, async (req, res) => {
  const formId = String(req.params.formId ?? "");
  const form = await prisma.form.findFirst({
    where: { id: formId, companyId: req.user!.companyId },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  if (!form || !form.versions[0] || form.versions[0].status !== "DRAFT") {
    return res.status(409).json({ message: "An editable draft is required before publishing." });
  }

  const draft = form.versions[0];
  const published = await prisma.$transaction(async (tx) => {
    await tx.formVersion.updateMany({
      where: { formId, status: "ACTIVE" },
      data: { status: "INACTIVE" },
    });

    await tx.formVersion.updateMany({
      where: { formId, status: "DRAFT", id: { not: draft.id } },
      data: { status: "INACTIVE" },
    });

    const nextVersion = await tx.formVersion.update({
      where: { id: draft.id },
      data: {
        status: "ACTIVE",
        updatedBy: req.user!.userId,
      },
    });

    await tx.formVersion.create({
      data: {
        formId,
        versionNumber: draft.versionNumber + 1,
        schemaJson: draft.schemaJson ?? { fields: [] },
        workflowId: draft.workflowId,
        status: "DRAFT",
        createdBy: req.user!.userId,
      },
    });

    await tx.form.update({
      where: { id: formId },
      data: { status: "PUBLISHED" },
    });

    return nextVersion;
  });

  return res.status(201).json({ version: published });
});

app.post("/api/forms/:formId/archive", requireAuth, requireAdmin, async (req, res) => {
  const form = await prisma.form.findFirst({
    where: { id: String(req.params.formId ?? ""), companyId: req.user!.companyId },
  });

  if (!form) {
    return res.status(404).json({ message: "Form not found." });
  }

  await prisma.form.update({
    where: { id: form.id },
    data: { status: "ARCHIVED" },
  });

  return res.status(200).json({ message: "Form archived." });
});

app.get("/api/workflows", requireAuth, requireAdmin, async (req, res) => {
  const workflows = await prisma.workflow.findMany({
    where: { companyId: req.user!.companyId },
    orderBy: { createdAt: "desc" },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
      formVersions: true,
    },
  });

  return res.status(200).json({
    workflows: workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      form: workflow.formVersions[0] ? "Linked form" : "No form linked",
      steps: workflow.steps.length,
    })),
  });
});

app.get("/api/workflows/:workflowId", requireAuth, requireAdmin, async (req, res) => {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: String(req.params.workflowId ?? ""),
      companyId: req.user!.companyId,
    },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      formVersions: {
        where: { status: "ACTIVE" },
        include: { form: { select: { id: true, name: true } } },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!workflow) {
    return res.status(404).json({ message: "Workflow not found." });
  }

  return res.status(200).json({
    workflow: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      form: workflow.formVersions[0]?.form.name ?? "No form linked",
      steps: workflow.steps.map((step) => {
        const rule = step.approvalJson && typeof step.approvalJson === "object" && !Array.isArray(step.approvalJson)
          ? step.approvalJson as Record<string, unknown>
          : {};
        return {
          id: step.id,
          name: step.name,
          stepOrder: step.stepOrder,
          approverType: String(rule.type ?? rule.kind ?? rule.scope ?? "ROLE").toUpperCase(),
          approverValue: String(rule.value ?? rule.target ?? rule.name ?? ""),
        };
      }),
    },
  });
});

app.post("/api/workflows", requireAuth, requireAdmin, async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const description = String(req.body?.description ?? "").trim();
  const steps = Array.isArray(req.body?.steps) ? req.body.steps : [];

  if (!name || steps.length === 0) {
    return res.status(400).json({ message: "Workflow name and at least one step are required." });
  }

  const workflow = await prisma.workflow.create({
    data: {
      companyId: req.user!.companyId,
      name,
      description: description || null,
      createdBy: req.user!.userId,
      status: "ACTIVE",
      steps: {
        create: steps.map((step: { name?: string; approverType?: string; approverValue?: string }, index: number) => ({
          name: String(step?.name ?? "").trim() || `Step ${index + 1}`,
          stepOrder: index + 1,
          approvalJson: {
            type: String(step?.approverType ?? "ROLE").toUpperCase(),
            value: String(step?.approverValue ?? "ADMIN").trim(),
          },
          nextStepJson: index < steps.length - 1 ? { next: "next" } : null,
        })),
      },
    },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });

  return res.status(201).json({ workflow });
});

app.get("/api/requests", requireAuth, async (req, res) => {
  const submissions = await prisma.submission.findMany({
    where: {
      ...(req.user!.role === "ADMIN"
        ? { formVersion: { form: { companyId: req.user!.companyId } } }
        : { submittedBy: req.user!.userId, formVersion: { form: { companyId: req.user!.companyId } } }),
    },
    orderBy: { submittedAt: "desc" },
    include: {
      submitter: true,
      formVersion: {
        include: {
          form: true,
          workflow: {
            include: {
              steps: { orderBy: { stepOrder: "asc" } },
            },
          },
        },
      },
      currentStep: true,
    },
  });

  return res.status(200).json({
    requests: submissions.map((submission) => ({
      id: submission.id,
      form: submission.formVersion.form.name,
      submittedBy: submission.submitter.name,
      date: submission.submittedAt.toISOString(),
      status: submission.status,
      step: submission.currentStep?.name ?? "Complete",
      amount: "N/A",
    })),
  });
});

app.get("/api/requests/:submissionId", requireAuth, async (req, res) => {
  const submission = await prisma.submission.findFirst({
    where: {
      id: String(req.params.submissionId ?? ""),
      formVersion: { form: { companyId: req.user!.companyId } },
    },
    include: {
      submitter: { select: { name: true, email: true } },
      currentStep: true,
      formVersion: {
        include: {
          form: { select: { name: true } },
          workflow: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
        },
      },
      steps: {
        include: { actor: { select: { name: true } }, workflowStep: true },
      },
    },
  });

  if (!submission) {
    return res.status(404).json({ message: "Request not found." });
  }

  if (
    req.user!.role === "USER" &&
    submission.submittedBy !== req.user!.userId &&
    (submission.status !== "PENDING" || !submission.currentStep || !canUserApproveStep(req.user!, submission.currentStep))
  ) {
    return res.status(404).json({ message: "Request not found." });
  }

  return res.status(200).json({
    request: {
      id: submission.id,
      form: submission.formVersion.form.name,
      submittedBy: submission.submitter.name,
      submittedByEmail: submission.submitter.email,
      date: submission.submittedAt.toISOString(),
      status: submission.status,
      currentStepId: submission.currentStepId,
      step: submission.currentStep?.name ?? "Complete",
      workflow: submission.formVersion.workflow.name,
      steps: submission.formVersion.workflow.steps.map((step) => {
        const history = submission.steps.find((item) => item.workflowStepId === step.id);
        return {
          id: step.id,
          name: step.name,
          status: history?.status ?? (submission.currentStepId === step.id ? "PENDING" : "UPCOMING"),
          actedBy: history?.actor?.name ?? null,
          actedAt: history?.actedAt?.toISOString() ?? null,
          comment: history?.comment ?? null,
          approvalJson: step.approvalJson,
        };
      }),
      data: submission.dataJson,
    },
  });
});

app.get("/api/approvals", requireAuth, async (req, res) => {
  const regularUser = req.user!.role === "USER";
  const { page, pageSize, skip } = getPagination(req);
  const submissions = await prisma.submission.findMany({
    where: {
      status: "PENDING",
      formVersion: { form: { companyId: req.user!.companyId } },
    },
    orderBy: { submittedAt: "desc" },
    include: {
      submitter: true,
      formVersion: {
        include: { form: true },
      },
      currentStep: true,
    },
  });

  const visibleSubmissions = req.user!.role === "ADMIN"
    ? submissions
    : submissions.filter((submission) => submission.currentStep && canUserApproveStep(req.user!, submission.currentStep));
  const pageSubmissions = regularUser
    ? visibleSubmissions.slice(skip, skip + pageSize)
    : visibleSubmissions;

  return res.status(200).json({
    approvals: pageSubmissions.map((submission) => ({
      id: submission.id,
      form: submission.formVersion.form.name,
      submittedBy: submission.submitter.name,
      date: submission.submittedAt.toISOString(),
      status: submission.status,
      step: submission.currentStep?.name ?? "Awaiting review",
    })),
    ...(regularUser && {
      pagination: {
        page,
        pageSize,
        total: visibleSubmissions.length,
        totalPages: Math.ceil(visibleSubmissions.length / pageSize),
      },
    }),
  });
});

app.post("/api/requests", requireAuth, async (req, res) => {
  const formId = String(req.body?.formId ?? "").trim();
  const dataJson = req.body?.dataJson ?? {};

  if (!formId) {
    return res.status(400).json({ message: "A form id is required." });
  }

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      companyId: req.user!.companyId,
      status: "PUBLISHED",
    },
    include: {
      versions: {
        where: { status: "ACTIVE" },
        take: 1,
        include: {
          workflow: {
            include: { steps: { orderBy: { stepOrder: "asc" } } },
          },
        },
      },
    },
  });

  if (!form) {
    return res.status(404).json({ message: "Form not found." });
  }

  const selectedVersion = form.versions[0];
  if (!selectedVersion) {
    return res.status(400).json({ message: "This form does not have an active version yet." });
  }

  const firstStep = selectedVersion.workflow.steps[0];

  const submission = await prisma.$transaction(async (tx) => {
    const createdSubmission = await tx.submission.create({
      data: {
        formVersionId: selectedVersion.id,
        submittedBy: req.user!.userId,
        dataJson,
        status: "PENDING",
        currentStepId: firstStep?.id ?? null,
        updatedBy: req.user!.userId,
      },
      include: {
        currentStep: true,
      },
    });

    if (firstStep) {
      await tx.submissionStep.create({
        data: {
          submissionId: createdSubmission.id,
          workflowStepId: firstStep.id,
          status: "PENDING",
        },
      });
    }

    return createdSubmission;
  });

  return res.status(201).json({ submission });
});

app.post("/api/approvals/:submissionId/decision", requireAuth, async (req, res) => {
  const submissionId = String(req.params.submissionId ?? "");
  const decision = String(req.body?.decision ?? "").toUpperCase();

  if (!submissionId || !["APPROVED", "REJECTED"].includes(decision)) {
    return res.status(400).json({ message: "A valid decision is required." });
  }

  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      formVersion: { form: { companyId: req.user!.companyId } },
    },
    include: {
      currentStep: true,
      formVersion: {
        include: {
          workflow: {
            include: {
              steps: { orderBy: { stepOrder: "asc" } },
            },
          },
        },
      },
      steps: true,
    },
  });

  if (!submission) {
    return res.status(404).json({ message: "Submission not found." });
  }

  if (submission.status !== "PENDING") {
    return res.status(409).json({ message: "This submission is no longer pending approval." });
  }

  if (!submission.currentStep) {
    return res.status(409).json({ message: "This submission does not currently require approval." });
  }

  if (req.user!.role !== "ADMIN" && !canUserApproveStep(req.user!, submission.currentStep)) {
    return res.status(403).json({ message: "You are not authorized to act on this approval step." });
  }

  const stepStatus = decision === "APPROVED" ? "APPROVED" : "REJECTED";
  const currentStep = submission.currentStep;

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      const existingStep = await tx.submissionStep.findFirst({
        where: {
          submissionId: submission.id,
          workflowStepId: currentStep.id,
        },
      });

      if (!existingStep || existingStep.status !== "PENDING") {
        throw new Error("STEP_NOT_PENDING");
      }

      const updatedCount = await tx.submissionStep.updateMany({
        where: {
          submissionId: submission.id,
          workflowStepId: currentStep.id,
          status: "PENDING",
        },
        data: {
          status: stepStatus,
          actedBy: req.user!.userId,
          actedAt: new Date(),
          comment: typeof req.body?.comment === "string" ? req.body.comment : null,
        },
      });

      if (updatedCount.count === 0) {
        throw new Error("STEP_NOT_PENDING");
      }

      if (decision === "REJECTED") {
        await tx.submission.update({
          where: { id: submission.id },
          data: {
            status: "REJECTED",
            currentStepId: null,
            updatedBy: req.user!.userId,
          },
        });

        return { outcome: "REJECTED" };
      }

      const workflowSteps = submission.formVersion.workflow.steps;
      const currentIndex = workflowSteps.findIndex((step) => step.id === currentStep.id);
      const nextStep = currentIndex >= 0 ? workflowSteps[currentIndex + 1] : null;

      if (nextStep) {
        await tx.submission.update({
          where: { id: submission.id },
          data: {
            currentStepId: nextStep.id,
            updatedBy: req.user!.userId,
          },
        });

        await tx.submissionStep.create({
          data: {
            submissionId: submission.id,
            workflowStepId: nextStep.id,
            status: "PENDING",
          },
        }).catch(() => undefined);

        return { outcome: "ADVANCED" };
      }

      await tx.submission.update({
        where: { id: submission.id },
        data: {
          status: "APPROVED",
          currentStepId: null,
          updatedBy: req.user!.userId,
        },
      });

      return { outcome: "APPROVED" };
    });

    if (transactionResult.outcome === "REJECTED") {
      return res.status(200).json({ message: "Submission rejected." });
    }

    if (transactionResult.outcome === "ADVANCED") {
      return res.status(200).json({ message: "Submission advanced to the next approval step." });
    }

    return res.status(200).json({ message: "Submission approved." });
  } catch (error) {
    if (error instanceof Error && error.message === "STEP_NOT_PENDING") {
      return res.status(409).json({ message: "This approval step is no longer pending." });
    }

    console.error("Approval decision error:", error);
    return res.status(500).json({ message: "Unable to update the approval decision." });
  }
});

export { prisma };
