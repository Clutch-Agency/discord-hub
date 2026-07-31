"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  AudioLines,
  Ban,
  Check,
  ChevronDown,
  Clock3,
  Info,
  LockKeyhole,
  Plus,
  Save,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { deleteVoiceHub, getGuildRoles, updateVoiceHub } from "./actions"

function RangeField({
  label,
  description,
  name,
  value,
  onChange,
  min,
  max,
  step,
  marks,
  formatValue,
  icon: Icon,
}) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="rounded-2xl border border-white/10 bg-[#19191d] p-5">
      <input type="hidden" name={name} value={value} />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
            <Icon size={19} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">{label}</h3>
            <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
              {description}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-lg border border-clutch-pink/25 bg-clutch-pink/10 px-3 py-1.5 text-sm font-semibold text-clutch-pink-light">
          {formatValue(value)}
        </span>
      </div>

      <div className="mt-6">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="voice-hub-range"
          style={{
            background: `linear-gradient(to right, #f92c6e 0%, #f92c6e ${percentage}%, #303038 ${percentage}%, #303038 100%)`,
          }}
        />

        <div className="mt-3 flex justify-between text-xs text-clutch-gray-lighter">
          {marks.map((mark) => (
            <span key={mark.value}>{mark.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ToggleField({
  id,
  name,
  checked,
  onChange,
  title,
  description,
  icon: Icon,
}) {
  return (
    <div
      className={`flex items-start justify-between gap-5 rounded-2xl border p-5 transition-colors ${
        checked
          ? "border-clutch-pink/35 bg-clutch-pink/[0.055]"
          : "border-white/10 bg-[#19191d]"
      }`}
    >
      <div className="flex min-w-0 gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            checked
              ? "bg-clutch-pink/15 text-clutch-pink"
              : "bg-white/[0.05] text-clutch-gray-lighter"
          }`}
        >
          <Icon size={19} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
            {description}
          </p>
        </div>
      </div>

      <label className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-white/15 transition-colors peer-checked:bg-clutch-pink" />
        <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  )
}

function RoleBadge({ role, onRemove }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm text-white">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: role?.color || "#c4c4c4" }}
      />

      <span className="max-w-40 truncate">{role?.name || "Cargo removido"}</span>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${role?.name || "cargo"}`}
          className="shrink-0 text-clutch-gray-lighter transition-colors hover:text-white"
        >
          <X size={14} />
        </button>
      ) : null}
    </span>
  )
}

function RoleSelector({
  title,
  description,
  name,
  icon: Icon,
  roles,
  selectedIds,
  onChange,
  disabled,
  disabledDescription,
  accent = "pink",
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selectedRoles = useMemo(
    () =>
      selectedIds.map((id) => roles.find((role) => role.id === id) || {
        id,
        name: "Cargo removido",
        color: "#565656",
      }),
    [roles, selectedIds]
  )

  const filteredRoles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return roles.filter((role) =>
      role.name.toLowerCase().includes(normalizedQuery)
    )
  }, [query, roles])

  function toggleRole(roleId) {
    if (selectedIds.includes(roleId)) {
      onChange(selectedIds.filter((id) => id !== roleId))
      return
    }

    onChange([...selectedIds, roleId])
  }

  const colorClasses =
    accent === "blue"
      ? "bg-clutch-blue/10 text-clutch-blue"
      : accent === "green"
        ? "bg-clutch-green/10 text-clutch-green"
        : "bg-clutch-pink/10 text-clutch-pink"

  return (
    <div
      className={`rounded-2xl border p-5 transition-opacity ${
        disabled
          ? "border-white/5 bg-black/10 opacity-50"
          : "border-white/10 bg-[#19191d]"
      }`}
    >
      <input type="hidden" name={`${name}Present`} value="true" />

      {selectedIds.map((roleId) => (
        <input key={roleId} type="hidden" name={name} value={roleId} />
      ))}

      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClasses}`}
        >
          <Icon size={19} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
            {disabled ? disabledDescription : description}
          </p>
        </div>
      </div>

      <div className="relative mt-5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#141417] px-4 py-3 text-left text-sm text-clutch-gray-lighter transition-colors hover:border-clutch-pink/50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            <Plus size={17} className="text-clutch-pink" />
            Selecionar cargos
          </span>

          <ChevronDown
            size={18}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && !disabled ? (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#252529] shadow-2xl shadow-black/50">
            <div className="border-b border-white/10 p-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#141417] px-3 py-2">
                <Search size={16} className="text-clutch-gray-lighter" />

                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar cargo..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-clutch-gray-light"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto p-2">
              {filteredRoles.length === 0 ? (
                <p className="px-3 py-5 text-center text-sm text-clutch-gray-lighter">
                  Nenhum cargo encontrado.
                </p>
              ) : (
                filteredRoles.map((role) => {
                  const isSelected = selectedIds.includes(role.id)

                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/5"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: role.color || "#c4c4c4",
                          }}
                        />

                        <span className="truncate">{role.name}</span>
                      </span>

                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                          isSelected
                            ? "border-clutch-pink bg-clutch-pink text-white"
                            : "border-white/20 text-transparent"
                        }`}
                      >
                        <Check size={14} />
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ) : null}
      </div>

      {selectedRoles.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedRoles.map((role) => (
            <RoleBadge
              key={role.id}
              role={role}
              onRemove={
                disabled
                  ? undefined
                  : () => onChange(selectedIds.filter((id) => id !== role.id))
              }
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-clutch-gray-lighter">
          Nenhum cargo selecionado.
        </p>
      )}
    </div>
  )
}

function SectionTitle({ icon: Icon, badge, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
        <Icon size={20} />
      </div>

      <div>
        {badge ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.13em] text-clutch-pink-light">
            {badge}
          </p>
        ) : null}

        <h2 className="text-lg font-bold text-white">{title}</h2>

        <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function VoiceHubEditor({ voiceHub, guild }) {
  const [userLimit, setUserLimit] = useState(voiceHub.userLimit ?? 0)
  const [bitrate, setBitrate] = useState(
    Math.round((voiceHub.bitrate ?? 64000) / 1000)
  )
  const [keepAliveMinutes, setKeepAliveMinutes] = useState(
    voiceHub.keepAliveMinutes ?? 0
  )
  const [permissionMode, setPermissionMode] = useState(
    voiceHub.permissionMode ?? "allow_except"
  )
  const [syncWithCategory, setSyncWithCategory] = useState(
    voiceHub.syncWithCategory ?? false
  )
  const [syncWithHubChannel, setSyncWithHubChannel] = useState(
    voiceHub.syncWithHubChannel ?? false
  )
  const [permissionRoles, setPermissionRoles] = useState(
    voiceHub.permissionRoles ?? []
  )
  const [ignoredRoles, setIgnoredRoles] = useState(voiceHub.ignoredRoles ?? [])
  const [moderatorRoles, setModeratorRoles] = useState(
    voiceHub.moderatorRoles ?? []
  )
  const [roles, setRoles] = useState([])
  const [rolesError, setRolesError] = useState(false)

  useEffect(() => {
    async function loadRoles() {
      const result = await getGuildRoles(voiceHub.id)

      if (!result.ok) {
        setRolesError(true)
        return
      }

      setRoles(result.data.roles)
    }

    loadRoles()
  }, [voiceHub.id])

  const usesSyncedPermissions = syncWithCategory || syncWithHubChannel

  function handleCategorySync(value) {
    setSyncWithCategory(value)

    if (value) {
      setSyncWithHubChannel(false)
    }
  }

  function handleHubChannelSync(value) {
    setSyncWithHubChannel(value)

    if (value) {
      setSyncWithCategory(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/dashboard/voice-channels"
          aria-label="Voltar para a lista de Hubs"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-clutch-gray-lighter transition-colors hover:border-clutch-pink/50 hover:bg-clutch-pink/10 hover:text-clutch-pink"
        >
          <ArrowLeft size={20} />
        </Link>

        <div>
          <p className="text-sm text-clutch-gray-lighter">Canais temporários</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Configurar Hub
          </h1>
        </div>
      </div>

      <form action={updateVoiceHub} className="space-y-6">
        <input type="hidden" name="id" value={voiceHub.id} />
        <input type="hidden" name="permissionMode" value={permissionMode} />

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#202025] p-6 shadow-xl shadow-black/15 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-clutch-pink/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-28 h-52 w-52 rounded-full bg-clutch-blue/10 blur-3xl" />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-clutch-pink/25 bg-clutch-pink/10 px-3 py-1.5 text-xs font-semibold text-clutch-pink-light">
                <AudioLines size={14} />
                Hub ativo no Discord
              </div>

              <SectionTitle
                icon={Settings2}
                title="Informações principais"
                description="Defina o canal de entrada e identifique a configuração deste Hub."
              />

              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-white"
              >
                Nome do canal Hub
              </label>

              <input
                id="name"
                name="name"
                type="text"
                defaultValue={voiceHub.name}
                minLength={1}
                maxLength={100}
                required
                className="w-full rounded-xl border border-white/10 bg-[#151518] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-clutch-gray-light focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
              />

              <p className="mt-2 text-sm text-clutch-gray-lighter">
                Os membros entram neste canal para criar uma sala temporária.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4 lg:min-w-64">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-clutch-gray-light">
                Servidor vinculado
              </p>

              <div className="mt-3 flex items-center gap-3">
                {guild?.icon ? (
                  <img
                    src={guild.icon}
                    alt={guild.name}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-clutch-blue/15 text-base font-bold text-clutch-blue">
                    {(guild?.name || "S").charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {guild?.name || "Servidor não encontrado"}
                  </p>

                  <p className="mt-0.5 text-xs text-clutch-gray-lighter">
                    Hub configurado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#202025] p-6 sm:p-8">
          <SectionTitle
            icon={SlidersHorizontal}
            badge="Comportamento"
            title="Salas temporárias"
            description="Personalize como as salas são criadas quando alguém entra no Hub."
          />

          <div className="mb-6">
            <label
              htmlFor="tempChannelName"
              className="mb-2 block text-sm font-medium text-white"
            >
              Nome das salas temporárias
            </label>

            <input
              id="tempChannelName"
              name="tempChannelName"
              type="text"
              defaultValue={voiceHub.tempChannelName}
              minLength={1}
              maxLength={100}
              required
              className="w-full rounded-xl border border-white/10 bg-[#151518] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
            />

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5 text-sm leading-6 text-clutch-gray-lighter">
              <Info size={17} className="mt-0.5 shrink-0 text-clutch-blue" />
              Use <strong className="mx-1 text-white">{"{username}"}</strong> para
              o nome do membro e{" "}
              <strong className="mx-1 text-white">{"{index}"}</strong> para o
              número sequencial da sala.
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RangeField
              icon={Users}
              label="Limite de usuários"
              description="Quantidade máxima de pessoas por sala. Zero significa sem limite."
              name="userLimit"
              value={userLimit}
              onChange={setUserLimit}
              min={0}
              max={99}
              step={1}
              formatValue={(value) =>
                value === 0 ? "Sem limite" : `${value} usuários`
              }
              marks={[
                { value: 0, label: "∞" },
                { value: 20, label: "20" },
                { value: 40, label: "40" },
                { value: 60, label: "60" },
                { value: 80, label: "80" },
                { value: 99, label: "99" },
              ]}
            />

            <RangeField
              icon={AudioLines}
              label="Taxa de bits"
              description="Qualidade de áudio padrão aplicada às salas criadas."
              name="bitrateKbps"
              value={bitrate}
              onChange={setBitrate}
              min={8}
              max={96}
              step={8}
              formatValue={(value) => `${value} kbps`}
              marks={[
                { value: 8, label: "8" },
                { value: 32, label: "32" },
                { value: 64, label: "64" },
                { value: 96, label: "96" },
              ]}
            />

            <RangeField
              icon={Clock3}
              label="Manter ativo"
              description="Tempo até uma sala vazia ser apagada automaticamente."
              name="keepAliveMinutes"
              value={keepAliveMinutes}
              onChange={setKeepAliveMinutes}
              min={-1}
              max={10}
              step={1}
              formatValue={(value) =>
                value === -1
                  ? "Nunca"
                  : value === 0
                    ? "Imediato"
                    : `${value} min`
              }
              marks={[
                { value: -1, label: "∞" },
                { value: 0, label: "0" },
                { value: 2, label: "2" },
                { value: 4, label: "4" },
                { value: 6, label: "6" },
                { value: 8, label: "8" },
                { value: 10, label: "10" },
              ]}
            />

          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#202025] p-6 sm:p-8">
          <SectionTitle
            icon={Shield}
            badge="Acesso"
            title="Permissões das salas"
            description="Escolha se as salas herdam permissões existentes ou usam regras por cargo."
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <ToggleField
              id="syncWithCategory"
              name="syncWithCategory"
              checked={syncWithCategory}
              onChange={handleCategorySync}
              icon={LockKeyhole}
              title="Sincronizar com a categoria"
              description="Usa as permissões da categoria em que o Hub está localizado."
            />

            <ToggleField
              id="syncWithHubChannel"
              name="syncWithHubChannel"
              checked={syncWithHubChannel}
              onChange={handleHubChannelSync}
              icon={AudioLines}
              title="Sincronizar com o canal Hub"
              description="Usa as permissões específicas definidas no canal de entrada."
            />
          </div>

          <div className="my-8 h-px bg-white/10" />

          <div
            className={`transition-opacity ${
              usesSyncedPermissions ? "opacity-45" : ""
            }`}
          >
            <div className="mb-5">
              <h3 className="text-base font-semibold text-white">
                Regras por cargo
              </h3>

              <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
                Defina exatamente quais cargos podem ou não podem acessar as
                salas temporárias.
              </p>
            </div>

            {usesSyncedPermissions ? (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-clutch-pink/25 bg-clutch-pink/[0.06] px-4 py-3 text-sm leading-6 text-clutch-pink-light">
                <Info size={18} className="mt-0.5 shrink-0" />
                A sincronização está ativa. Estas regras serão salvas, mas só
                terão efeito quando as duas sincronizações forem desativadas.
              </div>
            ) : null}

            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                disabled={usesSyncedPermissions}
                onClick={() => setPermissionMode("deny_except")}
                className={`rounded-2xl border p-5 text-left transition-colors disabled:cursor-not-allowed ${
                  permissionMode === "deny_except"
                    ? "border-clutch-pink bg-clutch-pink/10"
                    : "border-white/10 bg-[#19191d] hover:border-white/25"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      permissionMode === "deny_except"
                        ? "border-clutch-pink"
                        : "border-white/25"
                    }`}
                  >
                    {permissionMode === "deny_except" ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-clutch-pink" />
                    ) : null}
                  </span>

                  <div>
                    <p className="font-semibold text-white">
                      Negar para todos, exceto
                    </p>

                    <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
                      Somente os cargos selecionados poderão entrar.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={usesSyncedPermissions}
                onClick={() => setPermissionMode("allow_except")}
                className={`rounded-2xl border p-5 text-left transition-colors disabled:cursor-not-allowed ${
                  permissionMode === "allow_except"
                    ? "border-clutch-pink bg-clutch-pink/10"
                    : "border-white/10 bg-[#19191d] hover:border-white/25"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      permissionMode === "allow_except"
                        ? "border-clutch-pink"
                        : "border-white/25"
                    }`}
                  >
                    {permissionMode === "allow_except" ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-clutch-pink" />
                    ) : null}
                  </span>

                  <div>
                    <p className="font-semibold text-white">
                      Permitir para todos, exceto
                    </p>

                    <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
                      Todos poderão entrar, menos os cargos selecionados.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {rolesError ? (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-sm leading-6 text-red-200">
                <Info size={18} className="mt-0.5 shrink-0" />
                Não foi possível carregar os cargos deste servidor. Confirme que
                o bot está online e possui acesso ao servidor Discord.
              </div>
            ) : null}

            <RoleSelector
              title={
                permissionMode === "deny_except"
                  ? "Cargos com acesso permitido"
                  : "Cargos com acesso negado"
              }
              description={
                permissionMode === "deny_except"
                  ? "Somente estes cargos poderão entrar nas salas temporárias."
                  : "Estes cargos não poderão entrar nas salas temporárias."
              }
              name="permissionRoles"
              icon={Shield}
              roles={roles}
              selectedIds={permissionRoles}
              onChange={setPermissionRoles}
              disabled={usesSyncedPermissions}
              disabledDescription="Desative a sincronização para configurar acesso por cargo."
            />
          </div>

          <div className="my-8 h-px bg-white/10" />

          <div className="grid gap-4 lg:grid-cols-2">
            <RoleSelector
              title="Cargos ignorados"
              description="Membros com estes cargos não criarão uma sala ao entrar no Hub."
              name="ignoredRoles"
              icon={Ban}
              roles={roles}
              selectedIds={ignoredRoles}
              onChange={setIgnoredRoles}
              disabled={false}
              disabledDescription=""
              accent="blue"
            />

            <RoleSelector
              title="Cargos moderadores"
              description="Estes cargos terão permissões extras para moderar e gerenciar as salas."
              name="moderatorRoles"
              icon={ShieldCheck}
              roles={roles}
              selectedIds={moderatorRoles}
              onChange={setModeratorRoles}
              disabled={false}
              disabledDescription=""
              accent="green"
            />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/dashboard/voice-channels"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-clutch-gray-lighter transition-colors hover:bg-white/10 hover:text-white"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-clutch-pink px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-clutch-pink/20 transition-all hover:-translate-y-0.5 hover:bg-clutch-pink-dark"
          >
            <Save size={18} />
            Salvar alterações
          </button>
        </div>
      </form>

      <section className="mt-10 rounded-3xl border border-red-500/25 bg-red-500/[0.045] p-6 sm:p-7">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-red-200">Zona de perigo</h2>

            <p className="mt-1 text-sm leading-6 text-red-100/65">
              Excluir este Hub remove o registro da plataforma e o canal Hub no
              Discord. As salas temporárias existentes não serão afetadas.
            </p>
          </div>

          <form action={deleteVoiceHub.bind(null, voiceHub.id)}>
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 hover:text-white"
            >
              <Trash2 size={17} />
              Excluir Hub
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
