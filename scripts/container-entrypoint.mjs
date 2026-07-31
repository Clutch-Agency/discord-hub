import { spawn } from "node:child_process"

const argumentsList = process.argv.slice(2)
const needsDatabase = argumentsList[0] === "--database"

if (needsDatabase) {
  argumentsList.shift()
}

const [command, ...commandArguments] = argumentsList

if (!command) {
  console.error("Comando do container não informado.")
  process.exit(64)
}

function requiredEnvironment(name) {
  const value = process.env[name]

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Variável obrigatória ausente: ${name}`)
  }

  return value
}

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const host = requiredEnvironment("POSTGRES_HOST")
  const port = process.env.POSTGRES_PORT || "5432"
  const database = requiredEnvironment("POSTGRES_DB")
  const user = requiredEnvironment("POSTGRES_USER")
  const password = requiredEnvironment("POSTGRES_PASSWORD")

  if (!/^[a-z][a-z0-9_]{0,62}$/.test(database)) {
    throw new Error("POSTGRES_DB deve usar apenas letras minúsculas, números e underscore.")
  }

  if (!/^[a-z][a-z0-9_]{0,62}$/.test(user)) {
    throw new Error("POSTGRES_USER deve usar apenas letras minúsculas, números e underscore.")
  }

  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error("POSTGRES_PORT inválida.")
  }

  const databaseUrl = new URL("postgresql://localhost")
  databaseUrl.username = user
  databaseUrl.password = password
  databaseUrl.hostname = host
  databaseUrl.port = port
  databaseUrl.pathname = `/${database}`
  databaseUrl.searchParams.set("schema", "public")
  databaseUrl.searchParams.set("sslmode", "disable")
  databaseUrl.searchParams.set("connect_timeout", "10")

  return databaseUrl.toString()
}

try {
  if (needsDatabase) {
    process.env.DATABASE_URL = buildDatabaseUrl()
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Configuração do banco inválida.")
  process.exit(78)
}

const child = spawn(command, commandArguments, {
  env: process.env,
  stdio: "inherit",
})

let forwardedSignal = null

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    forwardedSignal = signal
    child.kill(signal)
  })
}

child.once("error", () => {
  console.error("Não foi possível iniciar o processo do container.")
  process.exit(70)
})

child.once("exit", (code, signal) => {
  if (forwardedSignal || signal) {
    process.exit(0)
  }

  process.exit(code ?? 1)
})

