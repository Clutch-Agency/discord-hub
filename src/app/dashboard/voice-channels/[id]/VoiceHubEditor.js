"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Ban,
  Check,
  ChevronDown,
  Plus,
  Save,
  Search,
  Shield,
  ShieldCheck,
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
}) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">{label}</h3>
          <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
            {description}
          </p>
        </div>

        <span className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-white">
          {formatValue(value)}
        </span>
      </div>

      <input type="hidden" name={name} value={value} />

      <div className="pt-5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="voice-hub-range"
          style={{
            background: `linear-gradient(to right, #f92c6e 0%, #f92c6e ${percentage}%, #2d2d34 ${percentage}%, #2d2d34 100%)`,
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

function ToggleField({ id, name, checked, onChange, title, description }) {
  return (
    <div className="flex items-start justify-between gap-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
          {description}
        </p>
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
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: role?.color || "#c4c4c4" }}
      />
      <span className="max-w-40 truncate">{role?.name || "Cargo removido"}</span>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-clutch-gray-lighter transition-colors hover:text-white"
          aria-label={`Remover ${role?.name || "cargo"}`}
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
  }, [roles, query])

  function toggleRole(roleId) {
    if (selectedIds.includes(roleId)) {
      onChange(selectedIds.filter((id) => id !== roleId))
      return
    }

    onChange([...selectedIds, roleId])
  }

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        disabled
          ? "border-white/5 bg-black/10 opacity-50"
          : "border-white/10 bg-white/[0.02]"
      }`}
    >
      {selectedIds.map((roleId) => (
        <input key={roleId} type="hidden" name={name} value={roleId} />
      ))}

      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
          <Icon size={19} />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
            {disabled ? disabledDescription : description}
          </p>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-left text-sm text-clutch-gray-lighter transition-colors hover:border-clutch-pink/50 disabled:cursor-not-allowed"
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
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#252529] shadow-2xl shadow-black/40">
            <div className="border-b border-white/10 p-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#17171a] px-3 py-2">
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
                          style={{ backgroundColor: role.color || "#c4c4c4" }}
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

export default function VoiceHubEditor({ voiceHub, guild }) {
  const [userLimit, setUserLimit] = useState(voiceHub.userLimit ?? 0)
  const [bitrate, setBitrate] = useState(
    Math.round((voiceHub.bitrate ?? 64000) / 1000)
  )
  const [keepAliveMinutes, setKeepAliveMinutes] = useState(
    voiceHub.keepAliveMinutes ?? 0
  )
  const [ownershipLockMinutes, setOwnershipLockMinutes] = useState(
    voiceHub.ownershipLockMinutes ?? 0
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
      const result = await getGuildRoles(voiceHub.guildId)

      if (result.error) {
        setRolesError(true)
        return
      }

      setRoles(result.roles)
    }

    loadRoles()
  }, [voiceHub.guildId])

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
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/dashboard/voice-channels"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-clutch-gray-lighter transition-colors hover:border-clutch-pink/50 hover:bg-clutch-pink/10 hover:text-white"
          aria-label="Voltar para a lista de Hubs"
        >
          <ArrowLeft size={20} />
        </Link>

        <div>
          <p className="text-sm text-clutch-gray-lighter">Canais temporários</p>
          <h2 className="text-2xl font-bold text-white">Editar Hub</h2>
        </div>
      </div>

      <form action={updateVoiceHub} className="space-y-6">
        <input type="hidden" name="id" value={voiceHub.id} />
        <input type="hidden" name="permissionMode" value={permissionMode} />

        <section className="rounded-2xl border border-white/10 bg-[#1f1f23] p-6">
          <div className="mb-6 flex items-center gap-4 border-b border-white/10 pb-6">
            {guild?.icon ? (
              <img
                src={guild.icon}
                alt={guild.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-clutch-pink/15 text-lg font-bold text-clutch-pink">
                {(guild?.name || "S").charAt(0)}
              </div>
            )}

            <div>
              <p className="text-sm text-clutch-gray-lighter">Servidor Discord</p>
              <p className="font-semibold text-white">
                {guild?.name || "Servidor não encontrado"}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-white">
              Nome do canal Hub
            </label>

            <input
              id="name"
              name="name"
              type="text"
              defaultValue={voiceHub.name}
              required
              className="w-full rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-white outline-none transition-colors placeholder:text-clutch-gray-light focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
            />

            <p className="mt-2 text-sm text-clutch-gray-lighter">
              Este é o canal que os membros entram para criar uma sala temporária.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#1f1f23] p-6">
          <div className="mb-7">
            <h3 className="text-lg font-bold text-white">
              Configurações dos canais temporários
            </h3>
            <p className="mt-1 text-sm text-clutch-gray-lighter">
              Defina o comportamento padrão das salas criadas pelo Hub.
            </p>
          </div>

          <div className="mb-8">
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
              required
              className="w-full rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-white outline-none transition-colors focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
            />

            <p className="mt-2 text-sm text-clutch-gray-lighter">
              Use {"{username}"} para o nome do membro e {"{index}"} para um número sequencial.
            </p>
          </div>

          <RangeField
            label="Limite de usuários"
            description="Quantidade máxima de membros por sala temporária. Zero significa sem limite."
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
            label="Taxa de bits"
            description="Qualidade de áudio padrão aplicada às salas temporárias."
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
            label="Manter ativo"
            description="Duração em minutos até que os canais temporários sejam apagados depois que todos saírem do canal de voz temporário. 0 é imediatamente, ∞ é nunca."
            name="keepAliveMinutes"
            value={keepAliveMinutes}
            onChange={setKeepAliveMinutes}
            min={-1}
            max={10}
            step={1}
            formatValue={(value) =>
              value === -1 ? "Nunca" : value === 0 ? "Imediato" : `${value} min`
            }
            marks={[
              { value: -1, label: "∞" },
              { value: 0, label: "0" },
              { value: 1, label: "1" },
              { value: 2, label: "2" },
              { value: 3, label: "3" },
              { value: 4, label: "4" },
              { value: 5, label: "5" },
              { value: 6, label: "6" },
              { value: 7, label: "7" },
              { value: 8, label: "8" },
              { value: 9, label: "9" },
              { value: 10, label: "10" },
            ]}
          />

          <RangeField
            label="Bloqueio de propriedade"
            description="Duração em minutos até que os canais temporários estejam disponíveis para posse de propriedade após o proprietário ter deixado o canal de voz temporário. 0 é imediatamente, ∞ é nunca."
            name="ownershipLockMinutes"
            value={ownershipLockMinutes}
            onChange={setOwnershipLockMinutes}
            min={-1}
            max={10}
            step={1}
            formatValue={(value) =>
              value === -1 ? "Nunca" : value === 0 ? "Imediato" : `${value} min`
            }
            marks={[
              { value: -1, label: "∞" },
              { value: 0, label: "0" },
              { value: 1, label: "1" },
              { value: 2, label: "2" },
              { value: 3, label: "3" },
              { value: 4, label: "4" },
              { value: 5, label: "5" },
              { value: 6, label: "6" },
              { value: 7, label: "7" },
              { value: 8, label: "8" },
              { value: 9, label: "9" },
              { value: 10, label: "10" },
            ]}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#1f1f23] p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Permissões</h3>
            <p className="mt-1 text-sm text-clutch-gray-lighter">
              Escolha de onde as salas temporárias herdam suas permissões.
            </p>
          </div>

          <div className="space-y-3">
            <ToggleField
              id="syncWithCategory"
              name="syncWithCategory"
              checked={syncWithCategory}
              onChange={handleCategorySync}
              title="Sincronizar permissões com a categoria do Hub"
              description="As salas temporárias herdarão as permissões da categoria onde o Hub está localizado."
            />

            <ToggleField
              id="syncWithHubChannel"
              name="syncWithHubChannel"
              checked={syncWithHubChannel}
              onChange={handleHubChannelSync}
              title="Sincronizar permissões com o canal do Hub"
              description="As salas temporárias herdarão as permissões configuradas diretamente no canal Hub."
            />
          </div>

          <div className="my-7 h-px bg-white/10" />

          <div
            className={`transition-opacity ${
              usesSyncedPermissions ? "opacity-45" : ""
            }`}
          >
            <div className="mb-4">
              <h3 className="text-base font-semibold text-white">
                Permissões por cargo
              </h3>
              <p className="mt-1 text-sm text-clutch-gray-lighter">
                Defina quais cargos terão ou não terão acesso às salas temporárias.
              </p>
            </div>

            {usesSyncedPermissions ? (
              <div className="mb-5 rounded-xl border border-clutch-pink/25 bg-clutch-pink/[0.06] px-4 py-3 text-sm leading-6 text-clutch-pink-light">
                A sincronização está ativa. As permissões configuradas por cargo serão salvas, mas só serão usadas quando as duas sincronizações estiverem desativadas.
              </div>
            ) : null}

            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                disabled={usesSyncedPermissions}
                onClick={() => setPermissionMode("deny_except")}
                className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
                  permissionMode === "deny_except"
                    ? "border-clutch-pink bg-clutch-pink/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
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
                      Apenas os cargos selecionados poderão entrar nas salas.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={usesSyncedPermissions}
                onClick={() => setPermissionMode("allow_except")}
                className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
                  permissionMode === "allow_except"
                    ? "border-clutch-pink bg-clutch-pink/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
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
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">
                Não foi possível carregar os cargos do servidor. Confirme que o bot está online e possui acesso ao servidor.
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
                  ? "Somente estes cargos poderão entrar nos canais temporários."
                  : "Estes cargos não poderão entrar nos canais temporários."
              }
              name="permissionRoles"
              icon={Shield}
              roles={roles}
              selectedIds={permissionRoles}
              onChange={setPermissionRoles}
              disabled={usesSyncedPermissions}
              disabledDescription="Desative a sincronização de permissões para configurar acesso por cargo."
            />
          </div>

          <div className="my-7 h-px bg-white/10" />

          <div className="space-y-4">
            <RoleSelector
              title="Cargos ignorados"
              description="Membros com estes cargos não criam uma sala temporária ao entrar no Hub."
              name="ignoredRoles"
              icon={Ban}
              roles={roles}
              selectedIds={ignoredRoles}
              onChange={setIgnoredRoles}
              disabled={false}
              disabledDescription=""
            />

            <RoleSelector
              title="Cargos de moderadores"
              description="Estes cargos terão permissão para moderar e gerenciar as salas temporárias."
              name="moderatorRoles"
              icon={ShieldCheck}
              roles={roles}
              selectedIds={moderatorRoles}
              onChange={setModeratorRoles}
              disabled={false}
              disabledDescription=""
            />
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <Users size={18} className="mt-0.5 shrink-0 text-clutch-pink" />
            <p className="text-sm leading-6 text-clutch-gray-lighter">
              Os cargos selecionados serão gravados no Hub agora. A aplicação dessas regras nos canais temporários entrará na próxima etapa, quando ativarmos a lógica de criação automática no bot.
            </p>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-clutch-pink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-clutch-pink-dark"
          >
            <Save size={18} />
            Salvar alterações
          </button>
        </div>
      </form>

      <form
        action={deleteVoiceHub.bind(null, voiceHub.id)}
        className="mt-10 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-6"
      >
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-red-300">Excluir Hub</h3>
            <p className="mt-1 text-sm text-red-100/70">
              Remove o registro da plataforma e o canal Hub correspondente no Discord.
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Trash2 size={18} />
            Excluir Hub
          </button>
        </div>
      </form>
    </div>
  )
}