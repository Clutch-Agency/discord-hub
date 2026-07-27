"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  LayoutTemplate,
  Mic,
  Server,
  Settings2,
} from "lucide-react"
import { toggleTool } from "@/app/dashboard/tools-actions"

const ICONS = {
  LayoutTemplate,
  Mic,
  Server,
}

function NavigationItem({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-clutch-pink/10 text-clutch-pink"
          : "text-clutch-gray-lighter hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={18} />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export default function Sidebar({ tools }) {
  const pathname = usePathname()

  const additionalSystemTools = tools.filter(
    (tool) => tool.isCore && tool.href !== "/dashboard/servers"
  )

  const discordTools = tools.filter((tool) => !tool.isCore)

  return (
    <aside className="flex w-84 shrink-0 flex-col border-r border-white/10 bg-[#1a1a1d] px-4 py-6">
      <div className="mb-6 px-3">
        <img
          src="/logo/logo-white.png"
          alt="Clutch"
          className="h-7 w-auto"
        />
        <p className="mt-1 text-xs text-clutch-gray-light">Discord Hub</p>
      </div>

      <nav className="flex-1">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-clutch-gray-light">
          Sistema
        </p>

        <div className="space-y-1">
          <NavigationItem
            href="/dashboard"
            icon={Home}
            label="Home"
            active={pathname === "/dashboard"}
          />

          <NavigationItem
            href="/dashboard/servers"
            icon={Server}
            label="Servidores"
            active={pathname.startsWith("/dashboard/servers")}
          />

          {additionalSystemTools.map((tool) => {
            const Icon = ICONS[tool.icon] || Settings2

            return (
              <NavigationItem
                key={tool.key}
                href={tool.href}
                icon={Icon}
                label={tool.name}
                active={pathname.startsWith(tool.href)}
              />
            )
          })}
        </div>

        <div className="my-5 h-px bg-white/10" />

        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-clutch-gray-light">
          Ferramentas Discord
        </p>

        <div className="space-y-1">
          {discordTools.map((tool) => {
            const Icon = ICONS[tool.icon] || LayoutTemplate
            const isActive = pathname.startsWith(tool.href)

            return (
              <div
                key={tool.key}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-clutch-pink/10 text-clutch-pink"
                    : "text-clutch-gray-lighter hover:bg-white/5"
                }`}
              >
                {tool.enabled ? (
                  <Link
                    href={tool.href}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Icon size={18} />
                    <span className="truncate">{tool.name}</span>
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3 opacity-50">
                    <Icon size={18} />
                    <span className="truncate">{tool.name}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleTool(tool.key, !tool.enabled)}
                  aria-label={
                    tool.enabled
                      ? `Desativar ${tool.name}`
                      : `Ativar ${tool.name}`
                  }
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    tool.enabled ? "bg-clutch-pink" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      tool.enabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </nav>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Settings2 size={16} className="text-clutch-pink" />
          Clutch Hub
        </div>

        <p className="mt-2 text-xs leading-5 text-clutch-gray-lighter">
          Gerencie servidores e ferramentas Discord em um único painel.
        </p>
      </div>
    </aside>
  )
}