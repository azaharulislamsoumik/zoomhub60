
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { encryptToken } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAuthorizedAdmin() {
  const admin = await getCurrentAdmin();
  return Boolean(admin && admin.isActive);
}

function hasValidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) return false;

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

function safeConfig(config: {
  meetingLink: string | null;
  meetingId: string | null;
  meetingPasswordEnc: string | null;
  updatedAt: Date;
}) {
  return {
    meetingLink: config.meetingLink,
    meetingId: config.meetingId,
    hasMeetingPassword: Boolean(config.meetingPasswordEnc),
    updatedAt: config.updatedAt,
  };
}

export async function GET() {
  try {
    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const config = await prisma.meetingConfiguration.findUnique({
      where: { id: "primary" },
    });

    return NextResponse.json(
      {
        config: config
          ? safeConfig(config)
          : {
              meetingLink: null,
              meetingId: null,
              hasMeetingPassword: false,
              updatedAt: null,
            },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Meeting configuration GET error:", error);

    return NextResponse.json(
      { error: "Unable to load meeting configuration." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!hasValidOrigin(request)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    if (!(await isAuthorizedAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request data." },
        { status: 400 }
      );
    }

    const meetingLink =
      typeof body.meetingLink === "string"
        ? body.meetingLink.trim()
        : "";

    const meetingId =
      typeof body.meetingId === "string"
        ? body.meetingId.trim()
        : "";

    const meetingPassword =
      typeof body.meetingPassword === "string"
        ? body.meetingPassword
        : "";

    const clearMeetingPassword = body.clearMeetingPassword === true;

    if (meetingLink.length > 2048) {
      return NextResponse.json(
        { error: "Meeting link is too long." },
        { status: 400 }
      );
    }

    if (meetingLink) {
      try {
        const url = new URL(meetingLink);

        if (url.protocol !== "https:") {
          throw new Error("Invalid protocol");
        }
      } catch {
        return NextResponse.json(
          { error: "Enter a valid HTTPS meeting link." },
          { status: 400 }
        );
      }
    }

    if (meetingId.length > 32) {
      return NextResponse.json(
        { error: "Meeting ID is too long." },
        { status: 400 }
      );
    }

    if (
      meetingId &&
      !/^[0-9\s-]{9,20}$/.test(meetingId)
    ) {
      return NextResponse.json(
        { error: "Enter a valid numeric meeting ID." },
        { status: 400 }
      );
    }

    if (meetingPassword.length > 128) {
      return NextResponse.json(
        { error: "Meeting password is too long." },
        { status: 400 }
      );
    }

    const existing = await prisma.meetingConfiguration.findUnique({
      where: { id: "primary" },
      select: { meetingPasswordEnc: true },
    });

    const updateData: {
      meetingLink: string | null;
      meetingId: string | null;
      meetingPasswordEnc?: string | null;
    } = {
      meetingLink: meetingLink || null,
      meetingId: meetingId || null,
    };

    if (clearMeetingPassword) {
      updateData.meetingPasswordEnc = null;
    } else if (meetingPassword.length > 0) {
      updateData.meetingPasswordEnc = encryptToken(meetingPassword);
    }

    const config = await prisma.meetingConfiguration.upsert({
      where: { id: "primary" },
      create: {
        id: "primary",
        ...updateData,
        meetingPasswordEnc:
          updateData.meetingPasswordEnc ?? null,
      },
      update: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        config: safeConfig(config),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Meeting configuration PUT error:", error);

    return NextResponse.json(
      { error: "Unable to save meeting configuration." },
      { status: 500 }
    );
  }
}
