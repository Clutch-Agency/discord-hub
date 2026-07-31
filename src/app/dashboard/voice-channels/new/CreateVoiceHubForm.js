"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  AudioLines,
  CheckCircle2,
  Server,
  Sparkles,
} from "lucide-react"
import { createVoiceHub } from "./actions"
import ServerSelector from "./ServerSelector"

const MISSING_GUILD_FAILURE = Object.freeze({
  ok: false,
  code: "INVALID_INPUT",
  message: "Selecione um servidor para continuar.",
  field: "guildId",
})

const UNEXPECTED_FAILURE = Object.freeze({
  ok: false,
  code: "UNEXPECTED",
  message: "Não foi possível criar o Hub neste momento.",
})

export default function CreateVoiceHubForm({ guilds }) {
  const [selectedGuildId, setSelectedGuildId] = useState("")
  const [result, setResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectorRef = useRef(null)

  const guildError =
    result?.ok === false && result.field === "guildId" ? result.message : null
  const generalError =
    result?.ok === false && result.field !== "guildId" ? result.message : null

  function handleGuildSelect(guildId) {
    setSelectedGuildId(guildId)
    setResult(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!selectedGuildId) {
      setResult(MISSING_GUILD_FAILURE)
      selectorRef.current?.focus()
      return
    }

    const data = new FormData(event.currentTarget)
    setIsSubmitting(true)
    setResult(null)

    try {
      const actionResult = await createVoiceHub(data)

      if (actionResult) {
        setResult(actionResult)
      }
    } catch {
      setResult(UNEXPECTED_FAILURE)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-6 rounded-3xl border border-white/10 bg-[#1f1f23] p-6 sm:p-8"
    >
      <div className="flex items-start gap-4 border-b border-white/10 pb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-clutch-pink/10 text-clutch-pink">
          <Server size={21} />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Servidor de destino</h2>
          <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
            O bot criará um canal de voz que será usado como ponto de entrada
            para as salas temporárias.
          </p>
        </div>
      </div>

      <div className="mt-7">
        <label
          id="guildId-label"
          className="mb-2 block text-sm font-semibold text-white"
        >
          Selecione o servidor Discord
        </label>

        <ServerSelector
          ref={selectorRef}
          guilds={guilds}
          selectedGuildId={selectedGuildId}
          onSelect={handleGuildSelect}
          errorMessage={guildError}
        />

        <p className="mt-3 text-sm leading-6 text-clutch-gray-lighter">
          Apenas servidores onde o bot está conectado aparecem nesta lista.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
            <AudioLines size={18} />
          </div>
          <p className="mt-3 text-sm font-semibold text-white">
            Hub criado no Discord
          </p>
          <p className="mt-1 text-xs leading-5 text-clutch-gray-lighter">
            Um canal de voz será criado automaticamente.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clutch-blue/10 text-clutch-blue">
            <Sparkles size={18} />
          </div>
          <p className="mt-3 text-sm font-semibold text-white">
            Configuração guiada
          </p>
          <p className="mt-1 text-xs leading-5 text-clutch-gray-lighter">
            Nome, limites e permissões serão definidos em seguida.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <CheckCircle2 size={18} />
          </div>
          <p className="mt-3 text-sm font-semibold text-white">
            Pronto para usar
          </p>
          <p className="mt-1 text-xs leading-5 text-clutch-gray-lighter">
            O Hub passa a criar salas quando estiver configurado.
          </p>
        </div>
      </div>

      {generalError ? (
        <p
          role="alert"
          aria-live="polite"
          className="mt-6 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200"
        >
          {generalError}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/dashboard/voice-channels"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-clutch-gray-lighter transition-colors hover:bg-white/10 hover:text-white"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-clutch-pink px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-clutch-pink/20 transition-all hover:-translate-y-0.5 hover:bg-clutch-pink-dark disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isSubmitting ? "Criando Hub..." : "Criar Hub"}
          <ArrowRight size={18} />
        </button>
      </div>
    </form>
  )
}
