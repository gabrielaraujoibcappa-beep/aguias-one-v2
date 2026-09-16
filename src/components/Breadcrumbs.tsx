"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  rotulo: string;
  href?: string;
}

const ROTAS_MAP: Record<string, BreadcrumbItem[]> = {
  "/dashboard": [
    { rotulo: "Visão Geral", href: "/dashboard" },
  ],
  "/checkin/mod-1": [
    { rotulo: "Minha Jornada", href: "/checkin/mod-1" },
    { rotulo: "Módulo 1: Pastas Google Drive" },
  ],
  "/checkin/mod-2": [
    { rotulo: "Minha Jornada", href: "/checkin/mod-1" },
    { rotulo: "Módulo 2: Nomenclatura de Arquivos" },
  ],
  "/faturamento": [
    { rotulo: "Meu Negócio" },
    { rotulo: "Faturamento & Comprovantes (.ZIP)", href: "/faturamento" },
  ],
  "/canais": [
    { rotulo: "Meu Negócio" },
    { rotulo: "Canais de Atração", href: "/canais" },
  ],
  "/painel/turma": [
    { rotulo: "Operação da Turma", href: "/painel/turma" },
    { rotulo: "Semáforo & Resgate" },
  ],
  "/painel/modulos": [
    { rotulo: "Operação da Turma" },
    { rotulo: "Liberação de Módulos", href: "/painel/modulos" },
  ],
  "/painel/auditoria": [
    { rotulo: "Operação da Turma" },
    { rotulo: "Fila de Auditoria", href: "/painel/auditoria" },
  ],
  "/painel/faturamento": [
    { rotulo: "Operação da Turma" },
    { rotulo: "Metas & Faturamento", href: "/painel/faturamento" },
  ],
  "/admin/alunos": [
    { rotulo: "Gestão & Cadastros" },
    { rotulo: "Gestão de Alunos", href: "/admin/alunos" },
  ],
  "/admin/turmas": [
    { rotulo: "Gestão & Cadastros" },
    { rotulo: "Turmas & Matrículas", href: "/admin/turmas" },
  ],
};

export function Breadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") return null;

  const itens: BreadcrumbItem[] = ROTAS_MAP[pathname]
    || (pathname.startsWith("/painel/aluno/")
      ? [{ rotulo: "Operação" }, { rotulo: "Ficha do Mentorado" }]
      : [{ rotulo: pathname.replace("/", "").replace("-", " ") }]);

  return (
    <nav
      aria-label="Trilha de navegação"
      style={{
        borderBottom: "1px solid var(--cor-border-light)",
        backgroundColor: "#ffffff",
        padding: "8px var(--espaco-lg)",
        fontSize: "12px",
      }}
    >
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: "var(--cor-slate)",
        flexWrap: "wrap",
        fontFamily: "var(--font-family-ui)",
      }}>
        <Link
          href="/"
          style={{
            color: "var(--cor-slate)",
            textDecoration: "none",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cor-ink)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cor-slate)")}
        >
          Início
        </Link>

        {itens.map((item, idx) => {
          const isUltimo = idx === itens.length - 1;
          return (
            <React.Fragment key={idx}>
              <span style={{ color: "var(--cor-hairline)", userSelect: "none" }}>/</span>
              {item.href && !isUltimo ? (
                <Link
                  href={item.href}
                  style={{
                    color: "var(--cor-slate)",
                    textDecoration: "none",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--cor-ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--cor-slate)")}
                >
                  {item.rotulo}
                </Link>
              ) : (
                <span
                  style={{
                    color: isUltimo ? "var(--cor-ink)" : "var(--cor-slate)",
                    fontWeight: isUltimo ? 500 : 400,
                  }}
                  aria-current={isUltimo ? "page" : undefined}
                >
                  {item.rotulo}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
