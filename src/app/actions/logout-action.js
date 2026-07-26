"use server" // Esta deve ser a PRIMEIRA linha do arquivo

import { signOut } from "@/auth"

export async function logout() {
  await signOut()
}