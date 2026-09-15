import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÁGUIAS ONE — Sistema de Mentoria",
  description: "Sistema de Gestão Estratégica e Acompanhamento de Negócios Periciais — IBCAPPA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="layout-root">
          <Navbar />
          <Breadcrumbs />
          <main style={{ minHeight: "calc(100vh - 120px)", paddingBottom: "var(--espaco-section)" }}>
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
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
              <strong>ÁGUIAS ONE</strong> · Pós-Graduação em Gestão Estratégica de Negócios Periciais (IBCAPPA / UniBCAPPA)
              <div style={{ marginTop: "4px", fontSize: "12px" }}>
                Sistema de Acompanhamento, Check-in Modular, Faturamento & Comprovantes ZIP.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
