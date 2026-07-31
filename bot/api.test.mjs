import { afterEach, describe, expect, it, vi } from "vitest"
import { Collection } from "discord.js"
import botApi from "./api.js"

const { createBotApi } = botApi

const SECRET = "test-only-secret"
const GUILD_ID = "33333333333333333"
const ACTOR_ID = "11111111111111111"

const openServers = []

afterEach(async () => {
  await Promise.all(
    openServers.splice(0).map(
      (server) =>
        new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
        })
    )
  )
})

function createClient({ allowed = true } = {}) {
  const roles = new Collection([
    [
      GUILD_ID,
      {
        id: GUILD_ID,
        name: "@everyone",
        managed: false,
        position: 0,
        hexColor: "#000000",
      },
    ],
    [
      "55555555555555555",
      {
        id: "55555555555555555",
        name: "Producer",
        managed: false,
        position: 2,
        hexColor: "#ffffff",
      },
    ],
  ])

  const guild = {
    id: GUILD_ID,
    ownerId: allowed ? ACTOR_ID : "99999999999999999",
    members: {
      fetch: vi.fn(async () => ({
        permissions: { has: vi.fn(() => false) },
      })),
    },
    roles: {
      everyone: { id: GUILD_ID },
      fetch: vi.fn(async () => roles),
    },
  }

  return {
    guilds: {
      cache: new Collection([[GUILD_ID, guild]]),
    },
    isReady: vi.fn(() => true),
    user: null,
  }
}

async function startTestApi(client) {
  const app = createBotApi(client, { secret: SECRET })
  const server = await new Promise((resolve) => {
    const listeningServer = app.listen(0, "127.0.0.1", () => {
      resolve(listeningServer)
    })
  })

  openServers.push(server)

  const address = server.address()

  return `http://127.0.0.1:${address.port}`
}

describe("guild roles pilot API", () => {
  it("retorna cargos para ator autorizado", async () => {
    const baseUrl = await startTestApi(createClient())
    const response = await fetch(`${baseUrl}/guilds/${GUILD_ID}/roles`, {
      headers: {
        "x-bot-secret": SECRET,
        "x-actor-discord-id": ACTOR_ID,
      },
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      {
        id: "55555555555555555",
        name: "Producer",
        color: "#ffffff",
        position: 2,
      },
    ])
  })

  it("rejeita segredo interno inválido", async () => {
    const baseUrl = await startTestApi(createClient())
    const response = await fetch(`${baseUrl}/guilds/${GUILD_ID}/roles`, {
      headers: {
        "x-bot-secret": "wrong-secret",
        "x-actor-discord-id": ACTOR_ID,
      },
    })

    expect(response.status).toBe(401)
  })

  it("rejeita ator ausente", async () => {
    const baseUrl = await startTestApi(createClient())
    const response = await fetch(`${baseUrl}/guilds/${GUILD_ID}/roles`, {
      headers: { "x-bot-secret": SECRET },
    })

    expect(response.status).toBe(400)
  })

  it("rejeita ator sem permissão na guild", async () => {
    const baseUrl = await startTestApi(createClient({ allowed: false }))
    const response = await fetch(`${baseUrl}/guilds/${GUILD_ID}/roles`, {
      headers: {
        "x-bot-secret": SECRET,
        "x-actor-discord-id": ACTOR_ID,
      },
    })

    expect(response.status).toBe(403)
  })
})

