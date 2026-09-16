"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { PapelUsuario } from "@/lib/auth/roles";
import { BuscaRapidaModal } from "./BuscaRapidaModal";
import { ModalAluno } from "./admin/ModalAluno";
import {
  LogoEmblem,
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
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconMenu,
  IconX,
} from "./ui/Icons";

interface ItemSidebar {
  rotulo: string;
  href: string;
  icone: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  badge?: number;
}

interface GrupoSidebar {
  secao: string;
  itens: ItemSidebar[];
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { estado, mudarPapel, carregado } = useSistemaStore();

  const [recolhida, setRecolhida] = useState(false);
  const [mobileAberta, setMobileAberta] = useState(false);
  const [personaAberta, setPersonaAberta] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [modalNovoAlunoAberto, setModalNovoAlunoAberto] = useState(false);

  const personaRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setPersonaAberta(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  // Atalho global Ctrl+K e tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscaAberta((prev) => !prev);
      }
      if (e.key === "Escape") {
        setPersonaAberta(false);
        setMobileAberta(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fecha drawer mobile ao mudar de rota
  useEffect(() => {
    setMobileAberta(false);
  }, [pathname]);

  const isStaff = estado.papelAtual !== "mentorado";

  const personasConfig: { id: PapelUsuario; rotulo: string; cargo: string; nomeExemplo: string; rotaPadrao: string }[] = [
    { id: "mentorado", rotulo: "Mentorado", cargo: "Perito Solo", nomeExemplo: "Dr. Roberto Silva", rotaPadrao: "/dashboard" },
    { id: "concierge", rotulo: "Concierge", cargo: "Operação & Turma", nomeExemplo: "Flávio Lopes", rotaPadrao: "/painel/turma" },
    { id: "anjo", rotulo: "Anjo", cargo: "Suporte & Auditoria", nomeExemplo: "Ana Carolina", rotaPadrao: "/painel/modulos" },
    { id: "mentor", rotulo: "Mentor", cargo: "Coordenação", nomeExemplo: "Prof. Edilson Aguiais", rotaPadrao: "/painel/turma" },
    { id: "admin", rotulo: "Admin", cargo: "Gestão", nomeExemplo: "Coordenação UniBCAPPA", rotaPadrao: "/admin/alunos" },
  ];

  const personaAtiva = personasConfig.find((p) => p.id === estado.papelAtual) || personasConfig[0];

  const handleTrocaPapel = (papelId: PapelUsuario) => {
    mudarPapel(papelId);
    setPersonaAberta(false);
    const config = personasConfig.find((p) => p.id === papelId);
    if (config) router.push(config.rotaPadrao);
  };

  // Contagem dinâmica de entregas aguardando auditoria
  const entregasPendentes = estado.entregas.filter((e) => e.status === "aguardando_avaliacao").length;

  const linksMentorado: GrupoSidebar[] = [
    {
      secao: "PRINCIPAL",
      itens: [
        { rotulo: "Visão Geral", href: "/dashboard", icone: IconDashboard },
      ],
    },
    {
      secao: "JORNADA",
      itens: [
        { rotulo: "Check-in Modular", href: "/checkin/mod-1", icone: IconCheckCircle },
      ],
    },
    {
      secao: "MEU NEGÓCIO",
      itens: [
        { rotulo: "Faturamento & ZIP", href: "/faturamento", icone: IconCurrency },
        { rotulo: "7 Canais de Atração", href: "/canais", icone: IconGlobe },
      ],
    },
  ];

  const linksStaff: GrupoSidebar[] = [
    {
      secao: "OPERAÇÃO",
      itens: [
        { rotulo: "Turma & Semáforo", href: "/painel/turma", icone: IconUsers },
        { rotulo: "Liberação Módulos", href: "/painel/modulos", icone: IconUnlock },
        { rotulo: "Fila de Auditoria", href: "/painel/auditoria", icone: IconAudit, badge: entregasPendentes },
      ],
    },
    {
      secao: "CADASTROS",
      itens: [
        { rotulo: "Gestão de Alunos", href: "/admin/alunos", icone: IconUserPlus },
        { rotulo: "Gestão de Turmas", href: "/admin/turmas", icone: IconBuilding },
      ],
    },
  ];

  const gruposNavegacao: GrupoSidebar[] = isStaff ? linksStaff : linksMentorado;

  return (
    <>
      {/* Barra de Topo Mobile (< 1024px) */}
      <header className="sidebar-mobile-bar">
        <button
          type="button"
          onClick={() => setMobileAberta(true)}
          aria-label="Abrir menu de navegação"
          aria-expanded={mobileAberta}
          style={{
            background: "transparent",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "4px",
          }}
        >
          <IconMenu size={22} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <LogoEmblem size={20} style={{ color: "#b89047" }} />
          <span style={{ fontWeight: 700, letterSpacing: "-0.5px", fontSize: "16px", fontFamily: "var(--font-family-title)" }}>
            ÁGUIAS ONE
          </span>
        </div>

        <button
          type="button"
          onClick={() => setBuscaAberta(true)}
          aria-label="Buscar no sistema"
          style={{
            background: "transparent",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          <IconSearch size={18} />
        </button>
      </header>

      {/* Overlay Escurecido para o Drawer Mobile */}
      {mobileAberta && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileAberta(false)}
          aria-hidden="true"
        />
      )}

      {/* Container Principal da Sidebar */}
      <aside
        ref={sidebarRef}
        className={`sidebar-container ${recolhida ? "recolhida" : ""} ${mobileAberta ? "mobile-aberta" : ""}`}
        aria-label="Navegação lateral principal"
      >
        {/* Cabeçalho da Sidebar com Logomarca e Botão Fechar Mobile */}
        <div
          style={{
            padding: recolhida ? "16px 8px" : "18px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: recolhida ? "center" : "space-between",
          }}
        >
          <Link
            href={isStaff ? "/painel/turma" : "/dashboard"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#ffffff",
              textDecoration: "none",
            }}
          >
            <LogoEmblem size={24} style={{ color: "#b89047", flexShrink: 0 }} />
            {!recolhida && (
              <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                <div style={{ fontWeight: 700, letterSpacing: "-0.5px", fontSize: "16px", fontFamily: "var(--font-family-title)" }}>
                  ÁGUIAS ONE
                </div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  IBCAPPA · UniBCAPPA
                </div>
              </div>
            )}
          </Link>

          {/* Botão Fechar no Mobile */}
          <button
            type="button"
            onClick={() => setMobileAberta(false)}
            aria-label="Fechar menu de navegação"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: mobileAberta ? "flex" : "none",
              alignItems: "center",
              padding: "4px",
            }}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Seletor de Persona Integrado */}
        <div
          ref={personaRef}
          style={{
            position: "relative",
            padding: recolhida ? "12px 8px" : "12px 14px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <button
            type="button"
            onClick={() => setPersonaAberta(!personaAberta)}
            aria-haspopup="true"
            aria-expanded={personaAberta}
            title={recolhida ? `${personaAtiva.nomeExemplo} (${personaAtiva.cargo})` : undefined}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: recolhida ? "center" : "space-between",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "var(--radius-xs)",
              padding: "8px 10px",
              color: "#ffffff",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "var(--cor-action-vibrant, #0052ff)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  flexShrink: 0,
                  border: "1px solid rgba(0, 194, 255, 0.4)",
                  boxShadow: "0 0 8px rgba(0, 194, 255, 0.3)",
                }}
              >
                {personaAtiva.nomeExemplo.charAt(0)}
              </div>
              {!recolhida && (
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {personaAtiva.nomeExemplo}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>
                    {personaAtiva.cargo}
                  </div>
                </div>
              )}
            </div>
            {!recolhida && <IconChevronDown size={14} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />}
          </button>

          {/* Menu Dropdown de Personas */}
          {personaAberta && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "14px",
                right: "14px",
                marginTop: "4px",
                backgroundColor: "var(--cor-primary, #111827)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                zIndex: 60,
                padding: "6px",
                minWidth: "220px",
              }}
            >
              <div style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.4)", padding: "4px 8px", textTransform: "uppercase" }}>
                Alternar Perfil
              </div>
              {personasConfig.map((p) => {
                const ativo = p.id === estado.papelAtual;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTrocaPapel(p.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-xs)",
                      border: "none",
                      backgroundColor: ativo ? "rgba(0, 82, 255, 0.2)" : "transparent",
                      color: ativo ? "var(--cor-action-glow, #00c2ff)" : "#ffffff",
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: ativo ? 600 : 400 }}>{p.nomeExemplo}</div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>
                        {p.rotulo} · {p.cargo}
                      </div>
                    </div>
                    {ativo && <span style={{ fontSize: "11px", color: "var(--cor-action-glow, #00c2ff)" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Botão de Busca Rápida Integrado */}
        <div style={{ padding: recolhida ? "10px 8px" : "12px 14px" }}>
          <button
            type="button"
            onClick={() => setBuscaAberta(true)}
            aria-label="Buscar no sistema (Ctrl+K)"
            title={recolhida ? "Buscar (Ctrl+K)" : undefined}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: recolhida ? "center" : "space-between",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "var(--radius-xs)",
              padding: "7px 10px",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconSearch size={15} />
              {!recolhida && <span>Buscar no sistema...</span>}
            </div>
            {!recolhida && (
              <kbd
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  padding: "2px 5px",
                  borderRadius: "3px",
                  fontSize: "10px",
                  fontFamily: "var(--font-family-mono)",
                }}
              >
                Ctrl K
              </kbd>
            )}
          </button>
        </div>

        {/* Navegação Hierárquica por Seções */}
        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            padding: recolhida ? "8px 6px" : "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {gruposNavegacao.map((grupo, idx) => (
            <div key={idx}>
              {!recolhida && (
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    color: "rgba(255, 255, 255, 0.35)",
                    padding: "4px 8px 6px 8px",
                    fontFamily: "var(--font-family-mono)",
                  }}
                >
                  {grupo.secao}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {grupo.itens.map((item) => {
                  const ativo = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const IconComp = item.icone;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={ativo ? "page" : undefined}
                      title={recolhida ? item.rotulo : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: recolhida ? "center" : "space-between",
                        padding: recolhida ? "9px 0" : "8px 10px",
                        borderRadius: "var(--radius-xs)",
                        backgroundColor: ativo ? "rgba(0, 82, 255, 0.16)" : "transparent",
                        color: ativo ? "var(--cor-action-glow, #00c2ff)" : "rgba(255, 255, 255, 0.8)",
                        fontWeight: ativo ? 600 : 400,
                        fontSize: "13px",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                        borderLeft: ativo ? "3px solid var(--cor-action-vibrant, #0052ff)" : "3px solid transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <IconComp size={17} style={{ flexShrink: 0 }} />
                        {!recolhida && <span>{item.rotulo}</span>}
                      </div>

                      {!recolhida && item.badge !== undefined && item.badge > 0 && (
                        <span
                          style={{
                            backgroundColor: "#b91c1c",
                            color: "#ffffff",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "var(--radius-pill)",
                            fontFamily: "var(--font-family-mono)",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Ação Primária Contextual */}
        <div style={{ padding: recolhida ? "8px" : "12px 14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          {isStaff ? (
            <button
              type="button"
              onClick={() => setModalNovoAlunoAberto(true)}
              className="btn-primary"
              title={recolhida ? "+ Novo Mentorado" : undefined}
              style={{
                width: "100%",
                fontSize: "12px",
                padding: recolhida ? "8px 0" : "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                borderRadius: "var(--radius-xs)",
              }}
            >
              <IconUserPlus size={14} />
              {!recolhida && <span>+ Novo Mentorado</span>}
            </button>
          ) : (
            <Link
              href="/faturamento"
              className="btn-primary"
              title={recolhida ? "+ Faturamento" : undefined}
              style={{
                width: "100%",
                fontSize: "12px",
                padding: recolhida ? "8px 0" : "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                borderRadius: "var(--radius-xs)",
                textDecoration: "none",
              }}
            >
              <IconCurrency size={14} />
              {!recolhida && <span>+ Faturamento</span>}
            </Link>
          )}
        </div>

        {/* Rodapé da Sidebar: Turma e Botão de Alternância de Largura Desktop */}
        <div
          style={{
            padding: recolhida ? "10px 8px" : "12px 14px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: recolhida ? "center" : "space-between",
            fontSize: "11px",
            color: "rgba(255, 255, 255, 0.4)",
          }}
        >
          {!recolhida && (
            <span style={{ fontFamily: "var(--font-family-mono)" }}>
              Turma 2026.1
            </span>
          )}

          <button
            type="button"
            onClick={() => setRecolhida(!recolhida)}
            aria-label={recolhida ? "Expandir barra lateral" : "Recolher barra lateral"}
            title={recolhida ? "Expandir barra" : "Recolher barra"}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.5)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-xs)",
            }}
          >
            {recolhida ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      {/* Modal de Busca Rápida (Ctrl+K) */}
      <BuscaRapidaModal aberto={buscaAberta} aoFechar={() => setBuscaAberta(false)} />

      {/* Modal de Cadastro de Mentorado para Staff */}
      {modalNovoAlunoAberto && (
        <ModalAluno
          aberto={modalNovoAlunoAberto}
          turmas={estado.turmas}
          onFechar={() => setModalNovoAlunoAberto(false)}
          onSalvar={() => setModalNovoAlunoAberto(false)}
        />
      )}
    </>
  );
}
