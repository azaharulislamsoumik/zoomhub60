
import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    if (!origin || origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const admin = await getCurrentAdmin();

    if (!admin || !admin.isActive) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const accountId = body?.accountId;

    if (typeof accountId !== "string" || !accountId.trim()) {
      return NextResponse.json(
        { error: "Valid account ID is required." },
        { status: 400 }
      );
    }

    const account = await prisma.zoomAccount.findUnique({
      where: { id: accountId },
      select: { id: true },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Zoom account not found." },
        { status: 404 }
      );
    }

    const clientId = process.env.ZOOM_CLIENT_ID;
    const redirectUri = process.env.ZOOM_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Zoom OAuth configuration is incomplete." },
        { status: 500 }
      );
    }

    const state = randomBytes(32).toString("hex");
    const stateHash = createHash("sha256")
      .update(state)
      .digest("hex");

    await prisma.oAuthState.create({
      data: {
        stateHash,
        adminId: admin.id,
        accountId: account.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const cookieName = `zoom_oauth_${state.slice(0, 12)}`;

    const authorizationUrl = new URL(
      "https://zoom.us/oauth/authorize"
    );

    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("state", state);

    const response = NextResponse.json({
      authorizationUrl: authorizationUrl.toString(),
    });

    response.cookies.set(cookieName, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/zoom/callback",
      maxAge: 600,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to start Zoom authorization." },
      { status: 500 }
    );
  }
}
