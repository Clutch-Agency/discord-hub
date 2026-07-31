"use server"

import { actionFailure, actionSuccess } from "@/lib/contracts/action-result"
import { getAuthorizedVoiceHub } from "@/lib/voice-hubs/voice-hub-service"

export async function fetchVoiceHub(hubId) {
  try {
    const { voiceHub } = await getAuthorizedVoiceHub(hubId)

    return actionSuccess(voiceHub)
  } catch (error) {
    return actionFailure(error)
  }
}
