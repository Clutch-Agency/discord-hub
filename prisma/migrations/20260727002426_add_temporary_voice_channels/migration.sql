-- CreateTable
CREATE TABLE "TemporaryVoiceChannel" (
    "id" TEXT NOT NULL,
    "voiceHubId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emptySince" TIMESTAMP(3),

    CONSTRAINT "TemporaryVoiceChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemporaryVoiceChannel_channelId_key" ON "TemporaryVoiceChannel"("channelId");

-- CreateIndex
CREATE INDEX "TemporaryVoiceChannel_voiceHubId_idx" ON "TemporaryVoiceChannel"("voiceHubId");

-- CreateIndex
CREATE INDEX "TemporaryVoiceChannel_channelId_idx" ON "TemporaryVoiceChannel"("channelId");

-- AddForeignKey
ALTER TABLE "TemporaryVoiceChannel" ADD CONSTRAINT "TemporaryVoiceChannel_voiceHubId_fkey" FOREIGN KEY ("voiceHubId") REFERENCES "VoiceHub"("id") ON DELETE CASCADE ON UPDATE CASCADE;
