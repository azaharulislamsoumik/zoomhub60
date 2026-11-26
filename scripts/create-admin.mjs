
import { PrismaClient } from "@prisma/client";
import {
  randomBytes,
  scrypt as scryptCallback,
} from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import process from "node:process";

process.loadEnvFile();

const prisma = new PrismaClient();

const scrypt = promisify(scryptCallback);

async function readSecret(prompt) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("Please run this script directly in CMD or PowerShell.");
  }

  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let value = "";

    function cleanup() {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    }

    function onData(chunk) {
      for (const char of chunk.toString("utf8")) {
        if (char === "\u0003") {
          cleanup();
          reject(new Error("Operation cancelled."));
          return;
        }

        if (char === "\r" || char === "\n") {
          cleanup();
          resolve(value);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
          continue;
        }

        if (char >= " " && char !== "\u007f") {
          value += char;
        }
      }
    }

    process.stdin.on("data", onData);
  });
}

async function main() {
  const existingAdmin = await prisma.adminUser.count();

  if (existingAdmin > 0) {
    console.log("An administrator already exists.");
    console.log("Admin creation has been stopped for security.");
    return;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const email = (
      await rl.question("Admin email address: ")
    ).trim().toLowerCase();

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new Error("Please enter a valid email address.");
    }

    const password = await readSecret("Create password: ");

    if (password.length < 8 || password.length > 128) {
  throw new Error("Password must be 8-128 characters long.");
}

    const confirmPassword = await readSecret("Confirm password: ");

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const salt = randomBytes(16);
    const derivedKey = await scrypt(password, salt, 64);

    const passwordHash =
      `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;

    await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        isActive: true,
      },
    });

    console.log("\nAdministrator created successfully.");
    console.log(`Admin email: ${email}`);
    console.log("Password saved securely as a password hash.");
  } finally {
    rl.close();
  }
}

main()
  .catch((error) => {
    console.error("\nAdmin creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
