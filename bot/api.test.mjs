import { afterEach, describe, expect, it, vi } from "vitest"
import { ChannelType, Collection } from "discord.js"
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

function createClient({ allowed = true, channelFailure = false } = {}) {
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
    name: "Authorized Guild",
    memberCount: 42,
    iconURL: vi.fn(() => "https://cdn.example/guild.png"),
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
    channels: {
      create: vi.fn(async ({ name }) => {
        if (channelFailure) {
          throw new Error("Discord token and internal details")
        }

        return { id: "66666666666666666", name }
      }),
      fetch: vi.fn(async () => ({
        id: "66666666666666666",
        name: "Hub",
        type: ChannelType.GuildVoice,
        setName: vi.fn(async function setName(name) {
          this.name = name
        }),
        delete: vi.fn(),
      })),
    },
    leave: vi.fn(),
  }

  const client = {
    guilds: {
      cache: new Collection([[GUILD_ID, guild]]),
    },
    isReady: vi.fn(() => true),
    user: null,
  }

  client.testGuild = guild
  return client
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

describe("protected guild API", () => {
  it("lista apenas guilds administráveis pelo ator", async () => {
    const allowedUrl = await startTestApi(createClient())
    const allowedResponse = await fetch(`${allowedUrl}/guilds`, {
      headers: {
        "x-bot-secret": SECRET,
        "x-actor-discord-id": ACTOR_ID,
      },
    })

    expect(allowedResponse.status).toBe(200)
    await expect(allowedResponse.json()).resolves.toEqual([
      {
        id: GUILD_ID,
        name: "Authorized Guild",
        icon: "https://cdn.example/guild.png",
        memberCount: 42,
      },
    ])

    const deniedUrl = await startTestApi(createClient({ allowed: false }))
    const deniedResponse = await fetch(`${deniedUrl}/guilds`, {
      headers: {
        "x-bot-secret": SECRET,
        "x-actor-discord-id": ACTOR_ID,
      },
    })

    expect(deniedResponse.status).toBe(200)
    await expect(deniedResponse.json()).resolves.toEqual([])
  })

  it("não lista guilds sem ator válido", async () => {
    const baseUrl = await startTestApi(createClient())
    const response = await fetch(`${baseUrl}/guilds`, {
      headers: { "x-bot-secret": SECRET },
    })

    expect(response.status).toBe(400)
  })

  it("cria canal somente depois da autorização repetida", async () => {
    const client = createClient()
    const baseUrl = await startTestApi(client)
    const response = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bot-secret": SECRET,
          "x-actor-discord-id": ACTOR_ID,
        },
        body: JSON.stringify({ name: "Hub" }),
      }
    )

    expect(response.status).toBe(201)
    expect(client.testGuild.channels.create).toHaveBeenCalledWith({
      name: "Hub",
      type: ChannelType.GuildVoice,
    })
  })

  it("não executa efeitos mutáveis para ator negado", async () => {
    const client = createClient({ allowed: false })
    const baseUrl = await startTestApi(client)
    const headers = {
      "Content-Type": "application/json",
      "x-bot-secret": SECRET,
      "x-actor-discord-id": ACTOR_ID,
    }

    const createResponse = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels`,
      { method: "POST", headers, body: JSON.stringify({ name: "Hub" }) }
    )
    const updateResponse = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels/66666666666666666`,
      { method: "PATCH", headers, body: JSON.stringify({ name: "Hub" }) }
    )
    const deleteResponse = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels/66666666666666666`,
      { method: "DELETE", headers }
    )
    const leaveResponse = await fetch(`${baseUrl}/guilds/${GUILD_ID}`, {
      method: "DELETE",
      headers,
    })

    expect([
      createResponse.status,
      updateResponse.status,
      deleteResponse.status,
      leaveResponse.status,
    ]).toEqual([403, 403, 403, 403])
    expect(client.testGuild.channels.create).not.toHaveBeenCalled()
    expect(client.testGuild.channels.fetch).not.toHaveBeenCalled()
    expect(client.testGuild.leave).not.toHaveBeenCalled()
  })

  it("valida channelId antes de buscar o canal", async () => {
    const client = createClient()
    const baseUrl = await startTestApi(client)
    const response = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels/invalid`,
      {
        method: "DELETE",
        headers: {
          "x-bot-secret": SECRET,
          "x-actor-discord-id": ACTOR_ID,
        },
      }
    )

    expect(response.status).toBe(400)
    expect(client.testGuild.channels.fetch).not.toHaveBeenCalled()
  })

  it("não expõe detalhes de falha do Discord", async () => {
    const client = createClient({ channelFailure: true })
    const baseUrl = await startTestApi(client)
    const response = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bot-secret": SECRET,
          "x-actor-discord-id": ACTOR_ID,
        },
        body: JSON.stringify({ name: "Hub" }),
      }
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({ error: "failed to create voice channel" })
    expect(JSON.stringify(body)).not.toContain("token")
  })

  it("atualiza, exclui canal e sai da guild quando autorizado", async () => {
    const client = createClient()
    const voiceChannel = {
      id: "66666666666666666",
      name: "Hub",
      type: ChannelType.GuildVoice,
      setName: vi.fn(async function setName(name) {
        this.name = name
      }),
      delete: vi.fn(),
    }
    client.testGuild.channels.fetch.mockResolvedValue(voiceChannel)
    const baseUrl = await startTestApi(client)
    const headers = {
      "Content-Type": "application/json",
      "x-bot-secret": SECRET,
      "x-actor-discord-id": ACTOR_ID,
    }

    const updateResponse = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels/${voiceChannel.id}`,
      { method: "PATCH", headers, body: JSON.stringify({ name: "Renamed" }) }
    )
    const deleteResponse = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels/${voiceChannel.id}`,
      { method: "DELETE", headers }
    )
    const leaveResponse = await fetch(`${baseUrl}/guilds/${GUILD_ID}`, {
      method: "DELETE",
      headers,
    })

    expect([updateResponse.status, deleteResponse.status, leaveResponse.status])
      .toEqual([200, 200, 200])
    expect(voiceChannel.setName).toHaveBeenCalledWith("Renamed")
    expect(voiceChannel.delete).toHaveBeenCalledTimes(1)
    expect(client.testGuild.leave).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["ator ausente", GUILD_ID, undefined, 400],
    ["guild inválida", "invalid", ACTOR_ID, 400],
    ["guild inexistente", "77777777777777777", ACTOR_ID, 403],
  ])("nega remoção com %s sem executar leave", async (_label, guildId, actor, status) => {
    const client = createClient()
    const baseUrl = await startTestApi(client)
    const headers = { "x-bot-secret": SECRET }

    if (actor) {
      headers["x-actor-discord-id"] = actor
    }

    const response = await fetch(`${baseUrl}/guilds/${guildId}`, {
      method: "DELETE",
      headers,
    })

    expect(response.status).toBe(status)
    expect(client.testGuild.leave).not.toHaveBeenCalled()
  })

  it("confirma tipo de canal antes de alterá-lo", async () => {
    const client = createClient()
    const textChannel = {
      id: "66666666666666666",
      type: ChannelType.GuildText,
      setName: vi.fn(),
    }
    client.testGuild.channels.fetch.mockResolvedValue(textChannel)
    const baseUrl = await startTestApi(client)
    const response = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels/${textChannel.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-bot-secret": SECRET,
          "x-actor-discord-id": ACTOR_ID,
        },
        body: JSON.stringify({ name: "Nope" }),
      }
    )

    expect(response.status).toBe(404)
    expect(textChannel.setName).not.toHaveBeenCalled()
  })

  it.each([
    ["campo extra", { name: "Hub", type: 2 }, "application/json", 400],
    ["nome vazio", { name: "   " }, "application/json", 400],
    ["tipo incorreto", { name: 123 }, "application/json", 400],
    ["array", ["Hub"], "application/json", 400],
    ["content-type", { name: "Hub" }, "text/plain", 415],
  ])("rejeita body inválido (%s) antes de consultar o Discord", async (_label, body, contentType, status) => {
    const client = createClient()
    const baseUrl = await startTestApi(client)
    const response = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels`,
      {
        method: "POST",
        headers: {
          "Content-Type": contentType,
          "x-bot-secret": SECRET,
          "x-actor-discord-id": ACTOR_ID,
        },
        body: JSON.stringify(body),
      }
    )

    expect(response.status).toBe(status)
    expect(client.testGuild.members.fetch).not.toHaveBeenCalled()
    expect(client.testGuild.channels.create).not.toHaveBeenCalled()
  })

  it("rejeita JSON malformado e body excessivo sem consultar o Discord", async () => {
    const client = createClient()
    const baseUrl = await startTestApi(client)
    const headers = {
      "Content-Type": "application/json",
      "x-bot-secret": SECRET,
      "x-actor-discord-id": ACTOR_ID,
    }
    const invalidJson = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels`,
      { method: "POST", headers, body: "{" }
    )
    const excessiveBody = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "x".repeat(17 * 1024) }),
      }
    )

    expect(invalidJson.status).toBe(400)
    expect(excessiveBody.status).toBe(413)
    expect(client.testGuild.members.fetch).not.toHaveBeenCalled()
    expect(client.testGuild.channels.create).not.toHaveBeenCalled()
  })

  it("rejeita método e body não suportados sem executar efeitos", async () => {
    const client = createClient()
    const baseUrl = await startTestApi(client)
    const headers = {
      "Content-Type": "application/json",
      "x-bot-secret": SECRET,
      "x-actor-discord-id": ACTOR_ID,
    }
    const unsupportedMethod = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels`,
      { method: "PUT", headers, body: JSON.stringify({ name: "Hub" }) }
    )
    const deleteWithBody = await fetch(
      `${baseUrl}/guilds/${GUILD_ID}/voice-channels/66666666666666666`,
      { method: "DELETE", headers, body: JSON.stringify({ force: true }) }
    )

    expect(unsupportedMethod.status).toBe(404)
    expect(deleteWithBody.status).toBe(400)
    expect(client.testGuild.members.fetch).not.toHaveBeenCalled()
    expect(client.testGuild.channels.fetch).not.toHaveBeenCalled()
  })
})
