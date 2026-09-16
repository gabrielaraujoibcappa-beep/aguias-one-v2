import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÁGUIAS ONE — Sistema de Mentoria",
  description: "Sistema de Gestão Estratégica e Acompanhamento de Negócios Periciais — IBCAPPA",
  icons: {
    icon: "/logo-simbolo.png",
    shortcut: "/logo-simbolo.png",
    apple: "/logo-simbolo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/logo-simbolo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="app-main">
            <Breadcrumbs />
            <main style={{ flex: 1, minHeight: "calc(100vh - 120px)", paddingBottom: "var(--espaco-section)" }}>
              {children}
            </main>
            <footer style={{
              borderTop: "1px solid var(--cor-border-light)",
              backgroundColor: "var(--cor-canvas)",
              padding: "var(--espaco-xl) var(--espaco-lg)",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--cor-muted)",
            }}>
              <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <img
                    src="/logo-simbolo.png"
                    alt="ÁGUIAS ONE"
                    style={{ width: "20px", height: "20px", borderRadius: "4px" }}
                  />
                  <strong style={{ color: "var(--cor-primary)" }}>ÁGUIAS ONE</strong>
                  <span>· Pós-Graduação em Gestão Estratégica de Negócios Periciais</span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--cor-text-muted)" }}>
                  IBCAPPA · UniBCAPPA · Acompanhamento Prático, Check-in Modular & Faturamento Mensal.
                </div>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
