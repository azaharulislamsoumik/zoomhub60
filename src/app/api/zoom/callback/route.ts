import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { encryptToken } from "@/lib/encryption";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const zoomError = url.searchParams.get("error");

  let cookieName: string | null = null;

  function redirectWithStatus(status: string) {
    const destination = new URL("/", request.url);
    destination.searchParams.set("zoom", status);

    const response = NextResponse.redirect(destination);

    if (cookieName) {
      response.cookies.set(cookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/zoom/callback",
        maxAge: 0,
      });
    }

    return response;
  }

  if (!state || !/^[a-f0-9]{64}$/i.test(state)) {
    return redirectWithStatus("invalid_state");
  }

  cookieName = `zoom_oauth_${state.slice(0, 12)}`;

  const cookieState = request.cookies.get(cookieName)?.value;

  try {
    const stateHash = createHash("sha256")
      .update(state)
      .digest("hex");

    const savedState = await prisma.oAuthState.findUnique({
      where: { stateHash },
    });

    if (
      !savedState ||
      savedState.expiresAt <= new Date() ||
      !cookieState ||
      cookieState !== state
    ) {
      return redirectWithStatus("invalid_state");
    }

    const admin = await getCurrentAdmin();

    if (!admin || !admin.isActive || admin.id !== savedState.adminId) {
      return redirectWithStatus("unauthorized");
    }

    const consumed = await prisma.oAuthState.deleteMany({
      where: {
        id: savedState.id,
        stateHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (consumed.count !== 1) {
      return redirectWithStatus("invalid_state");
    }

    if (zoomError || !code) {
      return redirectWithStatus("authorization_denied");
    }

    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;
    const redirectUri = process.env.ZOOM_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Zoom OAuth configuration is incomplete.");
    }

    const basicAuth = Buffer.from(
      `${clientId}:${clientSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
      "https://zoom.us/oauth/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Zoom token exchange failed.");
    }

    const tokens = await tokenResponse.json();

    if (
      typeof tokens.access_token !== "string" ||
      typeof tokens.refresh_token !== "string" ||
      typeof tokens.expires_in !== "number"
    ) {
      throw new Error("Invalid Zoom token response.");
    }

    const userResponse = await fetch(
      "https://api.zoom.us/v2/users/me",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      throw new Error("Unable to verify Zoom account.");
    }

    const zoomUser = await userResponse.json();

    if (
      typeof zoomUser.id !== "string" ||
      typeof zoomUser.email !== "string"
    ) {
      throw new Error("Invalid Zoom account information.");
    }

    const existingAccount = await prisma.zoomAccount.findUnique({
      where: { zoomUserId: zoomUser.id },
      select: { id: true },
    });

    if (
      existingAccount &&
      existingAccount.id !== savedState.accountId
    ) {
      throw new Error("This Zoom account is already assigned.");
    }

    await prisma.zoomAccount.update({
      where: { id: savedState.accountId },
      data: {
        zoomUserId: zoomUser.id,
        email: zoomUser.email,
        accessTokenEnc: encryptToken(tokens.access_token),
        refreshTokenEnc: encryptToken(tokens.refresh_token),
        tokenExpiresAt: new Date(
          Date.now() + tokens.expires_in * 1000
        ),
        status: "CONNECTED",
      },
    });

    return redirectWithStatus("connected");
  } catch {
    return redirectWithStatus("connection_failed");
  }
}