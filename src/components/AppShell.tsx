"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main style={{ minHeight: "100vh", backgroundColor: "var(--cor-dark-deep, #0a0a0b)" }}>{children}</main>;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Breadcrumbs />
        <main style={{ flex: 1, minHeight: "calc(100vh - 120px)", paddingBottom: "var(--espaco-section)" }}>
          {children}
        </main>
        <footer
          style={{
            borderTop: "1px solid var(--cor-border-light)",
            backgroundColor: "var(--cor-canvas)",
            padding: "var(--espaco-xl) var(--espaco-lg)",
            textAlign: "center",
            fontSize: "13px",
            color: "var(--cor-muted)",
          }}
        >
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
  );
}
