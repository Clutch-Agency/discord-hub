"use server"

import { requireOperator } from "@/lib/auth/operator-authorization"
import {
  setToolEnabled,
  toggleToolForOperator,
} from "@/lib/user-tools"

export async function toggleTool(toolKey, enabled) {
  await toggleToolForOperator(toolKey, enabled, {
    requireOperator,
    persistToolState: setToolEnabled,
  })
}
