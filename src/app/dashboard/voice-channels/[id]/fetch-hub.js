"use server"

import { toAuthorizationFailure } from "@/lib/auth/authorization-error"
import { getAuthorizedVoiceHub } from "@/lib/voice-hubs/voice-hub-service"

export async function fetchVoiceHub(hubId) {
  try {
    const { voiceHub } = await getAuthorizedVoiceHub(hubId)

    return { error: false, data: voiceHub }
  } catch (error) {
    return { ...toAuthorizationFailure(error), data: null }
  }
}
