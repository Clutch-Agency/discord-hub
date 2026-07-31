"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { toAuthorizationFailure } from "@/lib/auth/authorization-error"
import {
  deleteAuthorizedVoiceHub,
  getAuthorizedVoiceHubRoles,
  updateAuthorizedVoiceHub,
} from "@/lib/voice-hubs/voice-hub-service"

function parseInteger(value) {
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
    return Number.NaN
  }

  return Number.parseInt(value, 10)
}

function getOptionalRoleList(formData, field) {
  if (formData.get(`${field}Present`) !== "true") {
    return undefined
  }

  return formData.getAll(field)
}

export async function getGuildRoles(voiceHubId) {
  try {
    const roles = await getAuthorizedVoiceHubRoles(voiceHubId)

    return { error: false, roles }
  } catch (error) {
    return { ...toAuthorizationFailure(error), roles: [] }
  }
}

export async function updateVoiceHub(formData) {
  const id = formData.get("id")

  await updateAuthorizedVoiceHub({
    id,
    name: formData.get("name"),
    tempChannelName: formData.get("tempChannelName"),
    userLimit: parseInteger(formData.get("userLimit")),
    bitrateKbps: parseInteger(formData.get("bitrateKbps")),
    keepAliveMinutes: parseInteger(formData.get("keepAliveMinutes")),
    ownershipLockMinutes: parseInteger(formData.get("ownershipLockMinutes")),
    syncWithCategory: formData.get("syncWithCategory") === "on",
    syncWithHubChannel: formData.get("syncWithHubChannel") === "on",
    permissionMode: formData.get("permissionMode"),
    permissionRoles: getOptionalRoleList(formData, "permissionRoles"),
    ignoredRoles: getOptionalRoleList(formData, "ignoredRoles"),
    moderatorRoles: getOptionalRoleList(formData, "moderatorRoles"),
  })

  revalidatePath(`/dashboard/voice-channels/${id}`)
  revalidatePath("/dashboard/voice-channels")
  redirect(`/dashboard/voice-channels/${id}`)
}

export async function deleteVoiceHub(id) {
  await deleteAuthorizedVoiceHub(id)
  revalidatePath("/dashboard/voice-channels")
  redirect("/dashboard/voice-channels")
}
