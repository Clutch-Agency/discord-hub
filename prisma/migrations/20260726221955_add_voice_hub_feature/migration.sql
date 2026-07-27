/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Channel` table. All the data in the column will be lost.
  - The primary key for the `UserTool` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `UserTool` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `UserTool` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserTool` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "UserTool_userId_toolKey_key";

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "UserTool" DROP CONSTRAINT "UserTool_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
DROP COLUMN "updatedAt",
ALTER COLUMN "enabled" SET DEFAULT true,
ADD CONSTRAINT "UserTool_pkey" PRIMARY KEY ("userId", "toolKey");

-- CreateTable
CREATE TABLE "VoiceHub" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tempChannelName" TEXT NOT NULL DEFAULT 'Reunião de {username}',
    "userLimit" INTEGER NOT NULL DEFAULT 0,
    "bitrate" INTEGER NOT NULL DEFAULT 64000,
    "keepAliveMinutes" INTEGER NOT NULL DEFAULT 0,
    "ownershipLockMinutes" INTEGER NOT NULL DEFAULT 0,
    "syncWithCategory" BOOLEAN NOT NULL DEFAULT false,
    "syncWithHubChannel" BOOLEAN NOT NULL DEFAULT false,
    "permissionMode" TEXT NOT NULL DEFAULT 'allow_except',
    "permissionRoles" TEXT[],
    "ignoredRoles" TEXT[],
    "moderatorRoles" TEXT[],

    CONSTRAINT "VoiceHub_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoiceHub_channelId_key" ON "VoiceHub"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- AddForeignKey
ALTER TABLE "VoiceHub" ADD CONSTRAINT "VoiceHub_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
