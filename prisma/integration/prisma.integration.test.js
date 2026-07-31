import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { PrismaClient } from "@prisma/client"

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip
const prisma = testDatabaseUrl
  ? new PrismaClient({ datasources: { db: { url: testDatabaseUrl } } })
  : null
const runId = `phase2a_${Date.now()}_${Math.random().toString(36).slice(2)}`
const userId = `user_${runId}`

describeWithDatabase("PostgreSQL descartável", () => {
  beforeAll(async () => {
    await prisma.user.create({ data: { id: userId, name: "Phase 2A test" } })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it("aplica atomicidade e a constraint única de channelId do VoiceHub", async () => {
    const channelId = "99999999999999999"

    await expect(
      prisma.$transaction([
        prisma.voiceHub.create({
          data: {
            userId,
            guildId: "88888888888888888",
            channelId,
            name: "Hub A",
          },
        }),
        prisma.voiceHub.create({
          data: {
            userId,
            guildId: "88888888888888888",
            channelId,
            name: "Hub B",
          },
        }),
      ])
    ).rejects.toMatchObject({ code: "P2002" })

    await expect(
      prisma.voiceHub.count({ where: { userId } })
    ).resolves.toBe(0)
  })
})
