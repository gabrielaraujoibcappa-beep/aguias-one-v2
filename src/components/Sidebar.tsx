"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { PapelUsuario } from "@/lib/auth/roles";
import { BuscaRapidaModal } from "./BuscaRapidaModal";
import { ModalAluno } from "./admin/ModalAluno";
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
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconMenu,
  IconX,
  IconMail,
  IconFolder
} from "./ui/Icons";
import { CONTAS_DEMO, MODO_DEMO, encerrarSessao, iniciarSessaoDemo } from "@/lib/auth/sessao-cliente";

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
  const { estado, mudarPapel, carregado, faturamentosPendentesAuditoria } = useSistemaStore();

  const [recolhida, setRecolhida] = useState(false);
  const [mobileAberta, setMobileAberta] = useState(false);
  const [personaAberta, setPersonaAberta] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [modalNovoAlunoAberto, setModalNovoAlunoAberto] = useState(false);
  const [viewportMobile, setViewportMobile] = useState(false);

  const personaRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const fecharDrawerRef = useRef<HTMLButtonElement>(null);
  const drawerEstavaAberto = useRef(false);

  // Detecta viewport mobile (< 1024px) para controlar `inert` do drawer
  useEffect(() => {
    const matcher = window.matchMedia("(max-width: 1023px)");
    setViewportMobile(matcher.matches);
    const onChange = (e: MediaQueryListEvent) => setViewportMobile(e.matches);
    matcher.addEventListener("change", onChange);
    return () => matcher.removeEventListener("change", onChange);
  }, []);

  // Foco no drawer quando abre no mobile
  useEffect(() => {
    if (mobileAberta) {
      drawerEstavaAberto.current = true;
      setTimeout(() => fecharDrawerRef.current?.focus(), 50);
    } else if (drawerEstavaAberto.current) {
      drawerEstavaAberto.current = false;
      hamburgerRef.current?.focus();
    }
  }, [mobileAberta]);

  // Prende o foco dentro do drawer enquanto estiver aberto no mobile
  const handleSidebarKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!mobileAberta || !viewportMobile || e.key !== "Tab" || !sidebarRef.current) return;
    const focaveis = sidebarRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focaveis.length === 0) return;
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  };

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

  const configPapel = personasConfig.find((p) => p.id === estado.papelAtual) || personasConfig[0];
  // Identidade exibida vem da sessão validada no servidor (SessaoSync)
  const personaAtiva = { ...configPapel, nomeExemplo: estado.usuarioAtual?.nome || configPapel.nomeExemplo };

  // Troca de persona = nova sessão demo; indisponível fora de desenvolvimento
  const handleTrocaPapel = (papelId: PapelUsuario) => {
    const conta = CONTAS_DEMO.find((c) => c.papel === papelId);
    const config = personasConfig.find((p) => p.id === papelId);
    if (!MODO_DEMO || !conta || !config) return;
    iniciarSessaoDemo(conta.email);
    mudarPapel(papelId);
    setPersonaAberta(false);
    window.location.assign(config.rotaPadrao);
  };

  const handleSair = async () => {
    setPersonaAberta(false);
    await encerrarSessao();
    window.location.assign("/login");
  };

  // Contagem dinâmica de entregas aguardando auditoria
  const entregasPendentes = estado.entregas.filter((e) => e.status === "aguardando_avaliacao").length;

  const linksMentorado: GrupoSidebar[] = [
    {
      secao: "Principal",
      itens: [
        { rotulo: "Visão Geral", href: "/dashboard", icone: IconDashboard },
      ],
    },
    {
      secao: "Jornada",
      itens: [
        { rotulo: "Check-in Modular", href: "/checkin/mod-1", icone: IconCheckCircle },
      ],
    },
    {
      secao: "Meu negócio",
      itens: [
        { rotulo: "Faturamento & ZIP", href: "/faturamento", icone: IconCurrency },
        { rotulo: "7 Canais de Atração", href: "/canais", icone: IconGlobe },
      ],
    },
  ];

  const linksStaff: GrupoSidebar[] = [
    {
      secao: "Operação da Turma",
      itens: [
        { rotulo: "Turma & Semáforo", href: "/painel/turma", icone: IconUsers },
        { rotulo: "Liberação Módulos", href: "/painel/modulos", icone: IconUnlock },
        { rotulo: "Fila de Auditoria", href: "/painel/auditoria", icone: IconAudit, badge: entregasPendentes },
        { rotulo: "Metas & Faturamento", href: "/painel/faturamento", icone: IconCurrency, badge: faturamentosPendentesAuditoria },
      ],
    },
    {
      secao: "Gestão & Cadastros",
      itens: [
        { rotulo: "Gestão de Alunos", href: "/admin/alunos", icone: IconUserPlus },
        { rotulo: "Gestão de Turmas", href: "/admin/turmas", icone: IconBuilding },
        { rotulo: "Chamadas (Presenças)", href: "/admin/chamadas", icone: IconCheckCircle },
        { rotulo: "Central de Relatórios", href: "/admin/relatorios", icone: IconFolder },
        { rotulo: "Templates de E-mail", href: "/admin/emails", icone: IconMail },
      ],
    },
  ];

  const gruposNavegacao: GrupoSidebar[] = isStaff ? linksStaff : linksMentorado;

  return (
    <>
      {/* Barra de Topo Mobile (< 1024px) */}
      <header className="sidebar-mobile-bar">
        <button
          ref={hamburgerRef}
          type="button"
          onClick={() => setMobileAberta(true)}
          aria-label="Abrir menu de navegação"
          aria-expanded={mobileAberta}
          aria-controls="sidebar-principal"
          className="sidebar-icon-btn"
          style={{
            background: "transparent",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          <IconMenu size={22} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/logo-simbolo.png"
            alt="ÁGUIAS ONE"
            style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "contain" }}
          />
          <img
            src="/logo-aguias-one.png"
            alt="ÁGUIAS ONE"
            style={{ height: "20px", maxWidth: "130px", objectFit: "contain" }}
          />
        </div>

        <button
          type="button"
          onClick={() => setBuscaAberta(true)}
          aria-label="Buscar no sistema"
          className="sidebar-icon-btn"
          style={{
            background: "transparent",
            border: "none",
            color: "#ffffff",
            cursor: "pointer",
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
        id="sidebar-principal"
        ref={sidebarRef}
        className={`sidebar-container ${recolhida ? "recolhida" : ""} ${mobileAberta ? "mobile-aberta" : ""}`}
        aria-label="Navegação lateral principal"
        onKeyDown={handleSidebarKeyDown}
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
            title="Ir para início"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#ffffff",
              textDecoration: "none",
            }}
          >
            {recolhida ? (
              <img
                src="/logo-simbolo.png"
                alt="ÁGUIAS ONE"
                style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "contain" }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <img
                  src="/logo-aguias-one.png"
                  alt="ÁGUIAS ONE"
                  style={{ height: "30px", maxWidth: "170px", objectFit: "contain" }}
                />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
                  IBCAPPA · UniBCAPPA
                </span>
              </div>
            )}
          </Link>

          {/* Botão Fechar no Mobile */}
          <button
            ref={fecharDrawerRef}
            type="button"
            onClick={() => setMobileAberta(false)}
            aria-label="Fechar menu de navegação"
            className="sidebar-icon-btn"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: mobileAberta ? "flex" : "none",
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
              {MODO_DEMO && (
              <>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.65)", padding: "4px 8px" }}>
                Alternar perfil (demo · dev)
              </div>
              {personasConfig.map((p) => {
                const ativo = p.id === estado.papelAtual;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTrocaPapel(p.id)}
                    aria-current={ativo ? "true" : undefined}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 10px",
                      borderRadius: "var(--radius-xs)",
                      border: "none",
                      backgroundColor: ativo ? "rgba(255, 255, 255, 0.1)" : "transparent",
                      color: "#ffffff",
                      fontSize: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: ativo ? 600 : 400 }}>{p.nomeExemplo}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
                        {p.rotulo} · {p.cargo}
                      </div>
                    </div>
                  </button>
                );
              })}
              </>
              )}
              <button
                type="button"
                onClick={handleSair}
                style={{
                  width: "100%",
                  marginTop: MODO_DEMO ? "4px" : 0,
                  padding: "8px 10px",
                  borderRadius: "var(--radius-xs)",
                  border: "none",
                  borderTop: MODO_DEMO ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                  backgroundColor: "transparent",
                  color: "#fca5a5",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Sair da conta
              </button>
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
              {!recolhida && <span>Buscar</span>}
            </div>
            {!recolhida && (
              <kbd
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  padding: "2px 5px",
                  borderRadius: "3px",
                  fontSize: "11px",
                  fontFamily: "inherit",
                }}
              >
                Ctrl K
              </kbd>
            )}
          </button>
        </div>

        {/* Navegação Hierárquica por Seções */}
        <nav
          aria-label="Navegação principal"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: recolhida ? "8px 6px" : "8px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {gruposNavegacao.map((grupo, idx) => {
            const secaoId = `sidebar-secao-${idx}`;
            return (
              <div key={idx} role="group" aria-labelledby={secaoId}>
                <div
                  id={secaoId}
                  className={recolhida ? "sr-only" : undefined}
                  style={
                    recolhida
                      ? undefined
                      : {
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "rgba(255, 255, 255, 0.6)",
                          padding: "4px 10px 6px 10px",
                        }
                  }
                >
                  {grupo.secao}
                </div>

                <ul className="sidebar-nav-list">
                  {grupo.itens.map((item) => {
                    const ativo = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const IconComp = item.icone;
                    const temBadge = item.badge !== undefined && item.badge > 0;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={ativo ? "page" : undefined}
                          title={recolhida ? item.rotulo : undefined}
                          className="sidebar-link"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "var(--radius-xs)",
                            backgroundColor: ativo ? "rgba(255, 255, 255, 0.1)" : "transparent",
                            color: ativo ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
                            fontWeight: ativo ? 600 : 400,
                            fontSize: "13px",
                            textDecoration: "none",
                            transition: "background-color 0.15s ease, color 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <IconComp size={17} style={{ flexShrink: 0 }} />
                            {/* Rótulo sempre presente no DOM: visível expandido, apenas para leitores de tela recolhido */}
                            <span className={recolhida ? "sr-only" : undefined}>{item.rotulo}</span>
                          </div>

                          {temBadge && !recolhida && (
                            <span
                              aria-label={`${item.badge} pendentes`}
                              style={{
                                backgroundColor: "#b91c1c",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 600,
                                padding: "1px 6px",
                                borderRadius: "var(--radius-pill)",
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                          {temBadge && recolhida && <span className="sr-only">, {item.badge} pendentes</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Ação Primária Contextual */}
        <div style={{ padding: recolhida ? "8px" : "12px 14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          {isStaff ? (
            <button
              type="button"
              onClick={() => setModalNovoAlunoAberto(true)}
              className="btn-primary"
              title={recolhida ? "Novo mentorado" : undefined}
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
              <span className={recolhida ? "sr-only" : undefined}>Novo mentorado</span>
            </button>
          ) : (
            <Link
              href="/faturamento"
              className="btn-primary"
              title={recolhida ? "Lançar faturamento" : undefined}
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
              <span className={recolhida ? "sr-only" : undefined}>Lançar faturamento</span>
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
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          {!recolhida && (
            <span>Turma 2026.1</span>
          )}

          <button
            type="button"
            onClick={() => setRecolhida(!recolhida)}
            aria-label={recolhida ? "Expandir barra lateral" : "Recolher barra lateral"}
            aria-expanded={!recolhida}
            title={recolhida ? "Expandir barra" : "Recolher barra"}
            className="sidebar-icon-btn"
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
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
