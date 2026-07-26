import "./globals.css"

export const metadata = {
  title: "Discord Hub",
  description: "Gerencie templates de servidores Discord",
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}