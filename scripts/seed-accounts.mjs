
import { PrismaClient } from "@prisma/client";
import process from "node:process";

process.loadEnvFile();

const prisma = new PrismaClient();

async function main() {
  console.log("Preparing ZoomHub 60 account slots...");

  for (let slot = 1; slot <= 60; slot++) {
    await prisma.zoomAccount.upsert({
      where: {
        slotNumber: slot,
      },
      update: {},
      create: {
        slotNumber: slot,
        displayName: `Zoom Account ${String(slot).padStart(2, "0")}`,
        status: "NOT_CONNECTED",
      },
    });
  }

  const total = await prisma.zoomAccount.count();

  console.log(`Account slots initialized. Total database profiles: ${total}`);
}

main()
  .catch((error) => {
    console.error("Account initialization failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
