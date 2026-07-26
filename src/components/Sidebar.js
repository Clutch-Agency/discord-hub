"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutTemplate, Home } from "lucide-react"
import { toggleTool } from "@/app/dashboard/tools-actions"

const ICONS = {
  LayoutTemplate: LayoutTemplate,
}

export default function Sidebar({ tools }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#1a1a1d] border-r border-white/10 flex flex-col py-6 px-4">
      <Link
        href="/dashboard"
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-4 text-sm font-medium transition-colors ${
          pathname === "/dashboard"
            ? "bg-clutch-pink/10 text-clutch-pink"
            : "text-clutch-gray-lighter hover:text-white hover:bg-white/5"
        }`}
      >
        <Home size={18} />
        Home
      </Link>

      <div className="h-px bg-white/10 mb-4" />

      <div className="flex flex-col gap-1">
        {tools.map((tool) => {
          const Icon = ICONS[tool.icon] || LayoutTemplate
          const isActive = pathname.startsWith(tool.href)

          return (
            <div
              key={tool.key}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive ? "bg-clutch-pink/10 text-clutch-pink" : "text-clutch-gray-lighter"
              }`}
            >
              {tool.enabled ? (
                <Link href={tool.href} className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon size={18} />
                  <span className="truncate">{tool.name}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 flex-1 min-w-0 opacity-50">
                  <Icon size={18} />
                  <span className="truncate">{tool.name}</span>
                </div>
              )}

              <button
                onClick={() => toggleTool(tool.key, !tool.enabled)}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                  tool.enabled ? "bg-clutch-pink" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    tool.enabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}