"use client"

import { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  ChevronDown,
  Search,
  Server,
  X,
} from "lucide-react"

function ServerAvatar({ guild, size = "md" }) {
  const dimensions = size === "lg" ? "h-10 w-10" : "h-8 w-8"

  if (guild.icon) {
    return (
      <img
        src={guild.icon}
        alt={guild.name}
        className={`${dimensions} shrink-0 rounded-xl object-cover`}
      />
    )
  }

  return (
    <div
      className={`flex ${dimensions} shrink-0 items-center justify-center rounded-xl bg-clutch-blue/15 text-sm font-bold text-clutch-blue`}
    >
      {guild.name.charAt(0).toUpperCase()}
    </div>
  )
}

const ServerSelector = forwardRef(function ServerSelector(
  { guilds, selectedGuildId, onSelect, errorMessage },
  triggerRef
) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef(null)

  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId)

  const filteredGuilds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return guilds
    }

    return guilds.filter((guild) =>
      guild.name.toLowerCase().includes(normalizedQuery)
    )
  }, [guilds, query])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  function selectGuild(guildId) {
    onSelect(guildId)
    setQuery("")
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="guildId" value={selectedGuildId} />

      <button
        ref={triggerRef}
        id="guildId-selector"
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-labelledby="guildId-label guildId-selector"
        aria-describedby={errorMessage ? "guildId-error" : undefined}
        aria-expanded={isOpen}
        aria-controls="guildId-options"
        aria-haspopup="menu"
        className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
          errorMessage
            ? "border-red-400/70 bg-red-500/[0.045] ring-2 ring-red-500/10"
            : isOpen
            ? "border-clutch-pink bg-clutch-pink/[0.06] ring-2 ring-clutch-pink/15"
            : "border-white/10 bg-[#17171a] hover:border-white/20"
        }`}
      >
        {selectedGuild ? (
          <span className="flex min-w-0 items-center gap-3">
            <ServerAvatar guild={selectedGuild} size="lg" />

            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">
                {selectedGuild.name}
              </span>

              <span className="mt-0.5 block text-xs text-clutch-gray-lighter">
                {selectedGuild.memberCount.toLocaleString("pt-BR")} membros
              </span>
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-3 text-clutch-gray-lighter">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-clutch-blue">
              <Server size={19} />
            </span>

            <span className="text-sm">Selecione um servidor</span>
          </span>
        )}

        <ChevronDown
          size={19}
          className={`shrink-0 text-clutch-gray-lighter transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {errorMessage ? (
        <p
          id="guildId-error"
          role="alert"
          aria-live="polite"
          className="mt-2 text-sm font-medium text-red-300"
        >
          {errorMessage}
        </p>
      ) : null}

      {isOpen ? (
        <div
          id="guildId-options"
          role="menu"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1e] shadow-2xl shadow-black/50"
        >
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121215] px-3 py-2.5 focus-within:border-clutch-pink/60">
              <Search size={17} className="shrink-0 text-clutch-gray-lighter" />

              <input
                autoFocus
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar servidor..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-clutch-gray-light"
              />

              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-clutch-gray-lighter transition-colors hover:text-white"
                  aria-label="Limpar busca"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {filteredGuilds.length > 0 ? (
              filteredGuilds.map((guild) => {
                const isSelected = guild.id === selectedGuildId

                return (
                  <button
                    key={guild.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onClick={() => selectGuild(guild.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? "bg-clutch-pink/10 text-white"
                        : "text-clutch-gray-lighter hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <ServerAvatar guild={guild} />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {guild.name}
                      </span>

                      <span className="mt-0.5 block text-xs text-clutch-gray-light">
                        {guild.memberCount.toLocaleString("pt-BR")} membros
                      </span>
                    </span>

                    {isSelected ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-clutch-pink text-white">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <Search
                  size={20}
                  className="mx-auto text-clutch-gray-light"
                />

                <p className="mt-3 text-sm font-medium text-white">
                  Nenhum servidor encontrado
                </p>

                <p className="mt-1 text-xs text-clutch-gray-lighter">
                  Tente buscar por outro nome.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
})

ServerSelector.displayName = "ServerSelector"

export default ServerSelector
