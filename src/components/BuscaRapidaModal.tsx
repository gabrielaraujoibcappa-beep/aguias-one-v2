"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconDashboard,
  IconCheckCircle,
  IconCurrency,
  IconGlobe,
  IconUsers,
  IconUnlock,
  IconAudit,
  IconUserPlus,
  IconBuilding,
  IconSearch,
} from "./ui/Icons";

interface ItemBusca {
  id: string;
  categoria: "Navegação" | "Ação" | "Gestão";
  titulo: string;
  descricao: string;
  rota: string;
  icone: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

const ITENS_CATALOGO: ItemBusca[] = [
  {
    id: "dash",
    categoria: "Navegação",
    titulo: "Visão Geral",
    descricao: "Painel do perito, semáforo operacional e metas do ciclo",
    rota: "/dashboard",
    icone: IconDashboard,
  },
  {
    id: "checkin",
    categoria: "Navegação",
    titulo: "Minha Jornada & Check-in",
    descricao: "Envio de evidências práticas dos módulos liberados",
    rota: "/checkin/mod-1",
    icone: IconCheckCircle,
  },
  {
    id: "fat",
    categoria: "Ação",
    titulo: "Declarar Faturamento",
    descricao: "Informe a receita bruta mensal e anexe comprovantes ou pacote .ZIP",
    rota: "/faturamento",
    icone: IconCurrency,
  },
  {
    id: "canais",
    categoria: "Navegação",
    titulo: "Canais de Atração",
    descricao: "Status e links de WhatsApp, Google Meu Negócio, Instagram e Ads",
    rota: "/canais",
    icone: IconGlobe,
  },
  {
    id: "turma",
    categoria: "Gestão",
    titulo: "Turma & Semáforo Semanal",
    descricao: "Saúde operacional dos alunos e acompanhamento de travas",
    rota: "/painel/turma",
    icone: IconUsers,
  },
  {
    id: "lib-mod",
    categoria: "Gestão",
    titulo: "Liberação de Módulos",
    descricao: "Desbloqueio pedagógico de módulos pelo Anjo / Concierge",
    rota: "/painel/modulos",
    icone: IconUnlock,
  },
  {
    id: "auditoria",
    categoria: "Gestão",
    titulo: "Fila de Auditoria",
    descricao: "Avaliação técnica das evidências submetidas pelos peritos",
    rota: "/painel/auditoria",
    icone: IconAudit,
  },
  {
    id: "metas-faturamento",
    categoria: "Gestão",
    titulo: "Metas & Faturamento da Turma",
    descricao: "Auditoria das declarações mensais e edição de metas por mentorado",
    rota: "/painel/faturamento",
    icone: IconCurrency,
  },
  {
    id: "crud-aluno",
    categoria: "Ação",
    titulo: "Cadastrar Novo Mentorado",
    descricao: "Matrícula de perito aluno na turma ativa",
    rota: "/admin/alunos",
    icone: IconUserPlus,
  },
  {
    id: "crud-turmas",
    categoria: "Gestão",
    titulo: "Gestão de Turmas",
    descricao: "Cronogramas, limites de vagas e encontros semanais",
    rota: "/admin/turmas",
    icone: IconBuilding,
  },
];

interface BuscaRapidaModalProps {
  aberto: boolean;
  aoFechar: () => void;
}

export function BuscaRapidaModal({ aberto, aoFechar }: BuscaRapidaModalProps) {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [selecionadoIdx, setSelecionadoIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto) {
      setTermo("");
      setSelecionadoIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [aberto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && aberto) {
        e.preventDefault();
        aoFechar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  const resultados = ITENS_CATALOGO.filter((item) => {
    const t = termo.toLowerCase();
    return (
      item.titulo.toLowerCase().includes(t) ||
      item.descricao.toLowerCase().includes(t) ||
      item.categoria.toLowerCase().includes(t)
    );
  });

  const handleNavegar = (rota: string) => {
    aoFechar();
    router.push(rota);
  };

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelecionadoIdx((prev) => (prev < resultados.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelecionadoIdx((prev) => (prev > 0 ? prev - 1 : resultados.length - 1));
    } else if (e.key === "Enter" && resultados[selecionadoIdx]) {
      e.preventDefault();
      handleNavegar(resultados[selecionadoIdx].rota);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Buscar áreas e tarefas"
      onClick={aoFechar}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(7, 24, 41, 0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "12vh 16px 16px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownList}
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#fff",
          borderRadius: "var(--radius-sm)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
          border: "1px solid var(--cor-border-light)",
          overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid var(--cor-border-light)",
          gap: "10px",
        }}>
          <IconSearch size={16} style={{ color: "var(--cor-slate)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar páginas, tarefas ou ferramentas..."
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setSelecionadoIdx(0);
            }}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "var(--cor-ink)",
              backgroundColor: "transparent",
            }}
          />
          <kbd style={{
            fontSize: "10px",
            backgroundColor: "var(--cor-soft-stone)",
            padding: "2px 6px",
            borderRadius: "3px",
            color: "var(--cor-slate)",
            border: "1px solid var(--cor-border-light)",
            fontFamily: "var(--font-family-mono)",
          }}>
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: "320px", overflowY: "auto", padding: "6px" }}>
          {resultados.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", color: "var(--cor-muted)", fontSize: "13px" }}>
              Nenhum resultado para "{termo}".
            </div>
          ) : (
            resultados.map((item, idx) => {
              const isSelecionado = idx === selecionadoIdx;
              const IconComp = item.icone;
              return (
                <div
                  key={item.id}
                  onClick={() => handleNavegar(item.rota)}
                  onMouseEnter={() => setSelecionadoIdx(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-xs)",
                    cursor: "pointer",
                    backgroundColor: isSelecionado ? "var(--cor-pale-green)" : "transparent",
                    transition: "background-color 0.1s ease",
                  }}
                >
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "var(--radius-xs)",
                    backgroundColor: isSelecionado ? "#fff" : "var(--cor-soft-stone)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isSelecionado ? "var(--cor-deep-green)" : "var(--cor-slate)",
                    flexShrink: 0,
                  }}>
                    <IconComp size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: isSelecionado ? 600 : 500,
                        color: isSelecionado ? "var(--cor-deep-green)" : "var(--cor-ink)",
                      }}>
                        {item.titulo}
                      </span>
                      <span style={{
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        color: "var(--cor-slate)",
                        backgroundColor: "var(--cor-soft-stone)",
                        padding: "1px 5px",
                        borderRadius: "2px",
                        fontFamily: "var(--font-family-mono)",
                      }}>
                        {item.categoria}
                      </span>
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "var(--cor-muted)",
                      marginTop: "1px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {item.descricao}
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--cor-slate)", fontFamily: "var(--font-family-mono)" }}>↵</span>
                </div>
              );
            })
          )}
        </div>

        <div style={{
          backgroundColor: "var(--cor-soft-stone)",
          padding: "8px 14px",
          borderTop: "1px solid var(--cor-border-light)",
          fontSize: "11px",
          color: "var(--cor-slate)",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-family-mono)",
        }}>
          <span>Navegar: ↑ ↓ · Abrir: Enter</span>
          <span>Atalho: ⌘K</span>
        </div>
      </div>
    </div>
  );
}
