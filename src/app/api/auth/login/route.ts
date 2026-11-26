
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createAdminSession,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Reject cross-origin login requests.
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password ||
      password.length > 128
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (
      !admin ||
      !admin.isActive ||
      !(await verifyPassword(password, admin.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    await createAdminSession(admin.id);

    await prisma.activityLog.create({
      data: {
        action: "ADMIN_LOGIN",
        adminId: admin.id,
        description: "Administrator logged in successfully.",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { error: "Unable to process login. Please try again." },
      { status: 500 }
    );
  }
}
