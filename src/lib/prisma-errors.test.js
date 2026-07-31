import { describe, expect, it } from "vitest"
import { AUTHORIZATION_ERROR_CODES } from "./auth/authorization-error.js"
import { mapPrismaError } from "./prisma-errors.js"

describe("Prisma error mapping", () => {
  it.each([
    ["P2002", AUTHORIZATION_ERROR_CODES.CONFLICT],
    ["P2003", AUTHORIZATION_ERROR_CODES.INVALID_INPUT],
    ["P2025", AUTHORIZATION_ERROR_CODES.NOT_FOUND],
    ["P2034", AUTHORIZATION_ERROR_CODES.CONFLICT],
  ])("mapeia %s sem expor mensagem interna", (prismaCode, expectedCode) => {
    const error = mapPrismaError({
      code: prismaCode,
      message: "postgres://secret@internal/provider detail",
    })

    expect(error.code).toBe(expectedCode)
    expect(error.publicMessage).not.toContain("secret")
    expect(error.publicMessage).not.toContain("provider")
  })

  it("mapeia falha desconhecida para indisponibilidade segura", () => {
    expect(mapPrismaError(new Error("raw database error"))).toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.PERSISTENCE_UNAVAILABLE,
    })
  })
})
