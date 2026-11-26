
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const accounts = await prisma.zoomAccount.findMany({
      orderBy: { slotNumber: "asc" },
      select: {
        id: true,
        slotNumber: true,
        displayName: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const summary = {
      total: accounts.length,
      connected: accounts.filter((a) => a.status === "CONNECTED").length,
      notConnected: accounts.filter((a) => a.status === "NOT_CONNECTED").length,
      tokenExpired: accounts.filter((a) => a.status === "TOKEN_EXPIRED").length,
      errors: accounts.filter((a) => a.status === "ERROR").length,
    };

    return NextResponse.json(
      { accounts, summary },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Account API error:", error);

    return NextResponse.json(
      { error: "Unable to load account profiles." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentAdmin();

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host && new URL(origin).host !== host) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const displayName =
      typeof body.displayName === "string"
        ? body.displayName.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required." },
        { status: 400 }
      );
    }

    if (displayName.length < 2 || displayName.length > 50) {
      return NextResponse.json(
        { error: "Account name must be 2-50 characters long." },
        { status: 400 }
      );
    }

    const existingAccount = await prisma.zoomAccount.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: "Account not found." },
        { status: 404 }
      );
    }

    const account = await prisma.zoomAccount.update({
      where: { id },
      data: { displayName },
      select: {
        id: true,
        slotNumber: true,
        displayName: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { success: true, account },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Account rename error:", error);

    return NextResponse.json(
      { error: "Unable to rename account." },
      { status: 500 }
    );
  }
}
