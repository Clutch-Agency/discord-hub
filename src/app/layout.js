import "./globals.css"

export const metadata = {
  title: "Clutch | Discord Hub",
  description: "Gerencie templates de servidores Discord",
  icons: {
    icon: "/logo/logo-pink.png",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}