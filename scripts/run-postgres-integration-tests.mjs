import { spawnSync } from "node:child_process"

const testDatabaseUrl = process.env.TEST_DATABASE_URL

if (!testDatabaseUrl) {
  console.error("TEST_DATABASE_URL não está configurada; teste PostgreSQL não executado.")
  process.exit(2)
}

let parsedUrl

try {
  parsedUrl = new URL(testDatabaseUrl)
} catch {
  console.error("TEST_DATABASE_URL não é uma URL PostgreSQL válida.")
  process.exit(2)
}

const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1)).toLowerCase()

if (
  !["postgres:", "postgresql:"].includes(parsedUrl.protocol) ||
  !databaseName.includes("test") ||
  testDatabaseUrl === process.env.DATABASE_URL
) {
  console.error(
    "TEST_DATABASE_URL deve apontar para um banco PostgreSQL separado cujo nome contenha 'test'."
  )
  process.exit(2)
}

function run(command, args, extraEnvironment = {}) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command
  const result = spawnSync(executable, args, {
    env: { ...process.env, ...extraEnvironment },
    stdio: "inherit",
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

run("npx", ["prisma", "migrate", "deploy"], {
  DATABASE_URL: testDatabaseUrl,
})
run("npx", ["vitest", "run", "prisma/integration/prisma.integration.test.js"])
