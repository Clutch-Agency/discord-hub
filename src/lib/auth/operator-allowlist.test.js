import { describe, expect, it } from "vitest"
import { AUTHORIZATION_ERROR_CODES } from "./authorization-error.js"
import {
  assertAllowedOperator,
  parseOperatorAllowlist,
} from "./operator-allowlist.js"

const OPERATOR_ID = "11111111111111111"
const OTHER_ID = "22222222222222222"

function expectCode(operation, code) {
  try {
    operation()
  } catch (error) {
    expect(error).toMatchObject({ code })
    return
  }

  throw new Error(`Era esperado o erro ${code}.`)
}

describe("operator allowlist", () => {
  it("autoriza um operador presente", () => {
    expect(assertAllowedOperator(OPERATOR_ID, OPERATOR_ID)).toBe(OPERATOR_ID)
  })

  it("nega um operador ausente", () => {
    expectCode(
      () => assertAllowedOperator(OTHER_ID, OPERATOR_ID),
      AUTHORIZATION_ERROR_CODES.ACCESS_DENIED
    )
  })

  it("rejeita configuração vazia", () => {
    expectCode(
      () => parseOperatorAllowlist("   "),
      AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION
    )
  })

  it("aceita espaços, vírgulas, ponto e vírgula e quebras de linha", () => {
    const allowed = parseOperatorAllowlist(
      ` ${OPERATOR_ID}, ${OTHER_ID};\n33333333333333333 `
    )

    expect([...allowed]).toEqual([
      OPERATOR_ID,
      OTHER_ID,
      "33333333333333333",
    ])
  })

  it("remove valores duplicados", () => {
    const allowed = parseOperatorAllowlist(
      `${OPERATOR_ID},${OPERATOR_ID} ${OTHER_ID}`
    )

    expect([...allowed]).toEqual([OPERATOR_ID, OTHER_ID])
  })

  it("rejeita identificador inválido na configuração", () => {
    expectCode(
      () => parseOperatorAllowlist(`${OPERATOR_ID},not-a-discord-id`),
      AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION
    )
  })

  it("rejeita configuração ausente", () => {
    expectCode(
      () => parseOperatorAllowlist(undefined),
      AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION
    )
  })

  it("falha de forma segura quando o ator possui ID inválido", () => {
    expectCode(
      () => assertAllowedOperator("invalid", OPERATOR_ID),
      AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED
    )
  })
})

