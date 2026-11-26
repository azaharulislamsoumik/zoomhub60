
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  destroyAdminSession,
  getCurrentAdmin,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const admin = await getCurrentAdmin();

    if (admin) {
      await prisma.activityLog.create({
        data: {
          action: "ADMIN_LOGOUT",
          adminId: admin.id,
          description: "Administrator logged out.",
        },
      });
    }

    await destroyAdminSession();

    return NextResponse.json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Admin logout error:", error);

    return NextResponse.json(
      { error: "Unable to process logout." },
      { status: 500 }
    );
  }
}
