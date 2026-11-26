-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('NOT_CONNECTED', 'CONNECTED', 'TOKEN_EXPIRED', 'ERROR');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "adminId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoomAccount" (
    "id" TEXT NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "zoomUserId" TEXT,
    "email" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "accessTokenEnc" TEXT,
    "refreshTokenEnc" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoomAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingConfiguration" (
    "id" TEXT NOT NULL DEFAULT 'primary',
    "meetingLink" TEXT,
    "meetingId" TEXT,
    "meetingPasswordEnc" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "adminId" TEXT,
    "accountId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_adminId_idx" ON "AdminSession"("adminId");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ZoomAccount_slotNumber_key" ON "ZoomAccount"("slotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ZoomAccount_zoomUserId_key" ON "ZoomAccount"("zoomUserId");

-- CreateIndex
CREATE INDEX "ZoomAccount_status_idx" ON "ZoomAccount"("status");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_accountId_idx" ON "ActivityLog"("accountId");

-- CreateIndex
CREATE INDEX "ActivityLog_adminId_idx" ON "ActivityLog"("adminId");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "ZoomAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
