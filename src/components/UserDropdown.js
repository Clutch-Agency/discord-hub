"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { logout } from "@/app/actions/logout-action" // Importe a nova Server Action

export default function UserDropdown({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Fecha o dropdown se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownRef])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-clutch-gray-lighter hover:text-white transition-colors p-2 rounded-lg"
      >
        <img
          src={user.image || "/logo/logo-pink.png"}
          alt="avatar"
          className="w-9 h-9 rounded-full border border-white/10"
        />
        <span className="text-sm font-medium hidden md:block">{user.name}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#1f1f23] border border-white/10 rounded-lg shadow-lg z-10">
          <div className="py-2">
            <form action={logout}> {/* Use a Server Action diretamente aqui */}
              <button
                type="submit"
                className="block w-full text-left px-4 py-2 text-sm text-clutch-gray-lighter hover:bg-white/5 hover:text-white transition-colors"
              >
                Sair
              </button>
            </form>
            {/* Futuras opções do menu aqui */}
          </div>
        </div>
      )}
    </div>
  )
}