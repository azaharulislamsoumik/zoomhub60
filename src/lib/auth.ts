
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keyLength: number
) => Promise<Buffer>;

const SESSION_COOKIE = "zoomhub60_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string) {
 if (password.length < 8 || password.length > 128) {
  throw new Error("Password must be 8–128 characters long.");
}

  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64);

  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string
) {
  try {
    const [algorithm, saltHex, keyHex] = storedHash.split("$");

    if (algorithm !== "scrypt" || !saltHex || !keyHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");
    const actualKey = await scrypt(password, salt, expectedKey.length);

    return (
      expectedKey.length === actualKey.length &&
      timingSafeEqual(expectedKey, actualKey)
    );
  } catch {
    return false;
  }
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.adminSession.create({
    data: {
      tokenHash,
      adminId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });

  if (!session) return null;

  if (
    session.expiresAt <= new Date() ||
    !session.admin.isActive
  ) {
    await prisma.adminSession.deleteMany({
      where: { tokenHash },
    });

    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session.admin;
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}
