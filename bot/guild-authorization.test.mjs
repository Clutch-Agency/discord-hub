import { describe, expect, it, vi } from "vitest"
import guildAuthorization from "./guild-authorization.js"

const {
  GUILD_AUTHORIZATION_CODES,
  authorizeGuildActor,
  canManageGuild,
} = guildAuthorization

const GUILD_ID = "33333333333333333"
const ACTOR_ID = "11111111111111111"

function createGuild({ ownerId = "99999999999999999", member, fetchError } = {}) {
  return {
    id: GUILD_ID,
    ownerId,
    members: {
      fetch: vi.fn(async () => {
        if (fetchError) {
          throw fetchError
        }

        return member
      }),
    },
  }
}

function createClient(guild) {
  return {
    guilds: {
      cache: new Map(guild ? [[GUILD_ID, guild]] : []),
    },
  }
}

describe("bot guild authorization", () => {
  it("autoriza o owner da guild", async () => {
    const guild = createGuild({
      ownerId: ACTOR_ID,
      member: { permissions: { has: vi.fn(() => false) } },
    })

    await expect(
      authorizeGuildActor(createClient(guild), GUILD_ID, ACTOR_ID)
    ).resolves.toMatchObject({ guildId: GUILD_ID, actorDiscordId: ACTOR_ID })
  })

  it("autoriza membro com Administrator ou ManageGuild", () => {
    const guild = { ownerId: "99999999999999999" }
    const administrator = { permissions: { has: vi.fn(() => true) } }
    const manager = {
      permissions: {
        has: vi.fn((permission) => permission === 32n),
      },
    }

    expect(canManageGuild(guild, administrator, ACTOR_ID)).toBe(true)
    expect(canManageGuild(guild, manager, ACTOR_ID)).toBe(true)
  })

  it("nega membro sem permissão administrativa", async () => {
    const guild = createGuild({
      member: { permissions: { has: vi.fn(() => false) } },
    })

    await expect(
      authorizeGuildActor(createClient(guild), GUILD_ID, ACTOR_ID)
    ).rejects.toMatchObject({
      code: GUILD_AUTHORIZATION_CODES.ACCESS_DENIED,
    })
  })

  it("nega usuário que não pertence à guild alvo", async () => {
    const unknownMember = Object.assign(new Error("unknown member"), {
      code: 10007,
    })
    const guild = createGuild({ fetchError: unknownMember })

    await expect(
      authorizeGuildActor(createClient(guild), GUILD_ID, ACTOR_ID)
    ).rejects.toMatchObject({
      code: GUILD_AUTHORIZATION_CODES.ACCESS_DENIED,
    })
  })

  it("impede acesso cruzado quando a guild alvo não está no bot", async () => {
    await expect(
      authorizeGuildActor(createClient(null), GUILD_ID, ACTOR_ID)
    ).rejects.toMatchObject({
      code: GUILD_AUTHORIZATION_CODES.ACCESS_DENIED,
    })
  })

  it("rejeita identificadores inválidos", async () => {
    await expect(
      authorizeGuildActor(createClient(null), "invalid", ACTOR_ID)
    ).rejects.toMatchObject({
      code: GUILD_AUTHORIZATION_CODES.INVALID_INPUT,
    })
  })

  it("não transforma falha da fonte de autorização em acesso", async () => {
    const guild = createGuild({ fetchError: new Error("Discord unavailable") })

    await expect(
      authorizeGuildActor(createClient(guild), GUILD_ID, ACTOR_ID)
    ).rejects.toMatchObject({ code: GUILD_AUTHORIZATION_CODES.UNAVAILABLE })
  })
})

