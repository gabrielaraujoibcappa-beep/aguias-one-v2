"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { PapelUsuario } from "@/lib/auth/roles";
import { BuscaRapidaModal } from "./BuscaRapidaModal";
import {
  LogoEmblem,
  IconSearch,
  IconChevronDown,
  IconUserPlus,
  IconCurrency,
  IconUsers,
} from "./ui/Icons";

interface SubItemNavegacao {
  rotulo: string;
  href: string;
  descricao?: string;
  badge?: number;
}

interface ItemNavegacao {
  id: string;
  rotulo: string;
  href?: string;
  subitens?: SubItemNavegacao[];
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { estado, mudarPapel, carregado } = useSistemaStore();

  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [submenuAbertoId, setSubmenuAbertoId] = useState<string | null>(null);
  const [seletorPersonaAberto, setSeletorPersonaAberto] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setSubmenuAbertoId(null);
      }
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setSeletorPersonaAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSubmenuAbertoId(null);
        setSeletorPersonaAberto(false);
        setMenuMobileAberto(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscaAberta((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setMenuMobileAberto(false);
    setSubmenuAbertoId(null);
  }, [pathname]);

  if (!carregado) return null;

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
    setSeletorPersonaAberto(false);
    const config = personasConfig.find((p) => p.id === papelId);
    if (config) router.push(config.rotaPadrao);
  };

  const itensMentorado: ItemNavegacao[] = [
    {
      id: "visao-geral",
      rotulo: "Visão Geral",
      href: "/dashboard",
    },
    {
      id: "jornada",
      rotulo: "Minha Jornada",
      href: "/checkin/mod-1",
    },
    {
      id: "negocio",
      rotulo: "Meu Negócio",
      subitens: [
        {
          rotulo: "Faturamento & Comprovantes (.ZIP)",
          href: "/faturamento",
          descricao: "Declaração de receita bruta e anexo de pacotes compactados",
        },
        {
          rotulo: "Canais de Atração (7 Canais)",
          href: "/canais",
          descricao: "Status e links de WhatsApp, Google Meu Negócio, Instagram e Ads",
        },
      ],
    },
  ];

  const pendenciasAuditoria = estado.entregas.filter((e) => e.status === "aguardando_avaliacao").length;

  const itensEquipe: ItemNavegacao[] = [
    {
      id: "turma",
      rotulo: "Turma & Semáforo",
      href: "/painel/turma",
    },
    {
      id: "ciclo-entregas",
      rotulo: "Ciclo de Entregas",
      subitens: [
        {
          rotulo: "Liberação de Módulos",
          href: "/painel/modulos",
          descricao: "Desbloqueio ativo de módulos para os alunos",
        },
        {
          rotulo: "Fila de Auditoria",
          href: "/painel/auditoria",
          descricao: "Validação de evidências e emissão de pareceres",
          badge: pendenciasAuditoria,
        },
      ],
    },
    {
      id: "cadastros",
      rotulo: "Cadastros",
      subitens: [
        {
          rotulo: "Gestão de Alunos",
          href: "/admin/alunos",
          descricao: "Matrículas, contatos e perfil pericial",
        },
        {
          rotulo: "Gestão de Turmas",
          href: "/admin/turmas",
          descricao: "Cronogramas, limites de vagas e encontros semanais",
        },
      ],
    },
  ];

  const itensAtivos = isStaff ? itensEquipe : itensMentorado;

  const isItemAtivo = (item: ItemNavegacao) => {
    if (item.href && pathname === item.href) return true;
    if (item.subitens) {
      return item.subitens.some((sub) => pathname.startsWith(sub.href));
    }
    return false;
  };

  return (
    <>
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--cor-border-light)",
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "10px var(--espaco-lg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--espaco-md)",
        }}>
          {/* Logo Minimalista Editorial */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              aria-label="Abrir menu de navegação"
              aria-expanded={menuMobileAberto}
              onClick={() => setMenuMobileAberto(!menuMobileAberto)}
              className="btn-mobile-toggle"
              style={{
                display: "none",
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                padding: "6px",
                color: "var(--cor-ink)",
              }}
            >
              {menuMobileAberto ? "✕" : "☰"}
            </button>

            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "var(--radius-xs)",
                backgroundColor: "var(--cor-deep-green)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <LogoEmblem size={16} />
              </div>
              <div>
                <div style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "-0.4px",
                  color: "var(--cor-primary)",
                  fontFamily: "var(--font-family-display)",
                }}>
                  ÁGUIAS ONE
                </div>
                <div style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "var(--cor-muted)",
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-family-mono)",
                }}>
                  Pós-Graduação
                </div>
              </div>
            </Link>
          </div>

          {/* Destinos Enxutos (Sem Emojis, Tipografia Sóbria) */}
          <nav
            ref={navRef}
            className="nav-desktop"
            style={{ display: "flex", gap: "4px", alignItems: "center" }}
            aria-label="Navegação Primária"
          >
            {itensAtivos.map((item) => {
              const ativo = isItemAtivo(item);
              const temSubmenu = Boolean(item.subitens && item.subitens.length > 0);
              const submenuAberto = submenuAbertoId === item.id;

              if (temSubmenu) {
                return (
                  <div key={item.id} style={{ position: "relative" }}>
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={submenuAberto}
                      onClick={() => setSubmenuAbertoId(submenuAberto ? null : item.id)}
                      style={{
                        fontSize: "13px",
                        fontWeight: ativo ? 600 : 400,
                        color: ativo ? "var(--cor-deep-green)" : "var(--cor-ink)",
                        backgroundColor: ativo ? "var(--cor-pale-green)" : "transparent",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "var(--radius-xs)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {item.rotulo}
                      <IconChevronDown
                        size={12}
                        style={{
                          transform: submenuAberto ? "rotate(180deg)" : "none",
                          transition: "transform 0.15s ease",
                          opacity: 0.6,
                        }}
                      />
                    </button>

                    {submenuAberto && (
                      <div
                        role="menu"
                        style={{
                          position: "absolute",
                          top: "calc(100% + 6px)",
                          left: 0,
                          backgroundColor: "#fff",
                          minWidth: "260px",
                          borderRadius: "var(--radius-sm)",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          border: "1px solid var(--cor-border-light)",
                          padding: "6px",
                          zIndex: 60,
                        }}
                      >
                        {item.subitens!.map((sub) => {
                          const subAtivo = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              role="menuitem"
                              onClick={() => setSubmenuAbertoId(null)}
                              style={{
                                display: "block",
                                padding: "8px 10px",
                                borderRadius: "var(--radius-xs)",
                                textDecoration: "none",
                                backgroundColor: subAtivo ? "var(--cor-pale-green)" : "transparent",
                                transition: "background-color 0.1s ease",
                              }}
                              onMouseEnter={(e) => {
                                if (!subAtivo) e.currentTarget.style.backgroundColor = "var(--cor-soft-stone)";
                              }}
                              onMouseLeave={(e) => {
                                if (!subAtivo) e.currentTarget.style.backgroundColor = "transparent";
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{
                                  fontSize: "13px",
                                  fontWeight: subAtivo ? 600 : 500,
                                  color: subAtivo ? "var(--cor-deep-green)" : "var(--cor-ink)",
                                }}>
                                  {sub.rotulo}
                                </span>
                                {sub.badge !== undefined && sub.badge > 0 && (
                                  <span style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    backgroundColor: "var(--cor-primary)",
                                    color: "#fff",
                                    padding: "1px 6px",
                                    borderRadius: "var(--radius-xs)",
                                    fontFamily: "var(--font-family-mono)",
                                  }}>
                                    {sub.badge}
                                  </span>
                                )}
                              </div>
                              {sub.descricao && (
                                <div style={{ fontSize: "11px", color: "var(--cor-muted)", marginTop: "2px" }}>
                                  {sub.descricao}
                                </div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href!}
                  style={{
                    fontSize: "13px",
                    fontWeight: ativo ? 600 : 400,
                    color: ativo ? "var(--cor-deep-green)" : "var(--cor-ink)",
                    backgroundColor: ativo ? "var(--cor-pale-green)" : "transparent",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-xs)",
                    textDecoration: "none",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {item.rotulo}
                </Link>
              );
            })}
          </nav>

          {/* Ações Direitas (Buscar, Ação Primária e Workspace Switcher) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Botão de Busca */}
            <button
              onClick={() => setBuscaAberta(true)}
              aria-label="Abrir busca rápida"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--cor-slate)",
                backgroundColor: "#fff",
                border: "1px solid var(--cor-border-light)",
                padding: "5px 10px",
                borderRadius: "var(--radius-xs)",
                cursor: "pointer",
                transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--cor-hairline)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--cor-border-light)")}
            >
              <IconSearch size={13} />
              <span className="search-text-label">Buscar...</span>
              <kbd style={{
                fontSize: "10px",
                backgroundColor: "var(--cor-soft-stone)",
                padding: "1px 4px",
                borderRadius: "3px",
                color: "var(--cor-slate)",
                fontFamily: "var(--font-family-mono)",
              }}>
                ⌘K
              </kbd>
            </button>

            {/* Ação Primária Contextual */}
            {isStaff ? (
              <Link
                href="/admin/alunos"
                className="btn-primary action-btn-top"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  borderRadius: "var(--radius-xs)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "var(--cor-primary)",
                }}
              >
                <IconUserPlus size={13} />
                <span>Novo Mentorado</span>
              </Link>
            ) : (
              <Link
                href="/faturamento"
                className="btn-primary action-btn-top"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 500,
                  borderRadius: "var(--radius-xs)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "var(--cor-primary)",
                }}
              >
                <IconCurrency size={13} />
                <span>Faturamento</span>
              </Link>
            )}

            {/* Workspace / Persona Switcher (Linear style) */}
            <div ref={personaRef} style={{ position: "relative" }}>
              <button
                type="button"
                aria-label="Alternar perfil de simulação"
                aria-haspopup="true"
                aria-expanded={seletorPersonaAberto}
                onClick={() => setSeletorPersonaAberto(!seletorPersonaAberto)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "transparent",
                  color: "var(--cor-ink)",
                  border: "1px solid var(--cor-border-light)",
                  padding: "5px 10px",
                  borderRadius: "var(--radius-xs)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--cor-soft-stone)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <IconUsers size={13} style={{ color: "var(--cor-slate)" }} />
                <span className="persona-name-label">{personaAtiva.rotulo}</span>
                <IconChevronDown size={11} style={{ opacity: 0.6 }} />
              </button>

              {seletorPersonaAberto && (
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    backgroundColor: "#fff",
                    minWidth: "220px",
                    borderRadius: "var(--radius-sm)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    border: "1px solid var(--cor-border-light)",
                    padding: "6px",
                    zIndex: 70,
                  }}
                >
                  <div style={{
                    padding: "6px 8px",
                    fontSize: "10px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--cor-muted)",
                    borderBottom: "1px solid var(--cor-border-light)",
                    marginBottom: "4px",
                    fontFamily: "var(--font-family-mono)",
                  }}>
                    Ambiente & Papel
                  </div>

                  {personasConfig.map((p) => {
                    const isAtivo = p.id === estado.papelAtual;
                    return (
                      <button
                        key={p.id}
                        role="menuitem"
                        onClick={() => handleTrocaPapel(p.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: "var(--radius-xs)",
                          border: "none",
                          backgroundColor: isAtivo ? "var(--cor-pale-green)" : "transparent",
                          cursor: "pointer",
                          color: isAtivo ? "var(--cor-deep-green)" : "var(--cor-ink)",
                          fontSize: "12px",
                          fontWeight: isAtivo ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!isAtivo) e.currentTarget.style.backgroundColor = "var(--cor-soft-stone)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isAtivo) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <div>
                          <div>{p.rotulo}</div>
                          <div style={{ fontSize: "11px", color: "var(--cor-muted)" }}>{p.nomeExemplo}</div>
                        </div>
                        {isAtivo && (
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--cor-deep-green)" }}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Menu Mobile */}
      {menuMobileAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação móvel"
          onClick={() => setMenuMobileAberto(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            zIndex: 90,
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "280px",
              maxWidth: "85vw",
              height: "100%",
              backgroundColor: "#fff",
              padding: "var(--espaco-lg)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-lg)" }}>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--cor-primary)", letterSpacing: "-0.3px" }}>
                ÁGUIAS ONE
              </div>
              <button
                onClick={() => setMenuMobileAberto(false)}
                aria-label="Fechar menu"
                style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "var(--cor-muted)" }}
              >
                ✕
              </button>
            </div>

            <nav aria-label="Navegação móvel" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {itensAtivos.map((item) => {
                if (item.subitens) {
                  return (
                    <div key={item.id} style={{ marginBottom: "6px" }}>
                      <div style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "var(--cor-muted)",
                        padding: "6px 8px",
                        fontFamily: "var(--font-family-mono)",
                      }}>
                        {item.rotulo}
                      </div>
                      <div style={{ paddingLeft: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                        {item.subitens.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={() => setMenuMobileAberto(false)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "var(--radius-xs)",
                              fontSize: "13px",
                              color: pathname === sub.href ? "var(--cor-deep-green)" : "var(--cor-ink)",
                              backgroundColor: pathname === sub.href ? "var(--cor-pale-green)" : "transparent",
                              fontWeight: pathname === sub.href ? 600 : 400,
                              textDecoration: "none",
                            }}
                          >
                            {sub.rotulo}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href!}
                    onClick={() => setMenuMobileAberto(false)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "13px",
                      color: pathname === item.href ? "var(--cor-deep-green)" : "var(--cor-ink)",
                      backgroundColor: pathname === item.href ? "var(--cor-pale-green)" : "transparent",
                      fontWeight: pathname === item.href ? 600 : 400,
                      textDecoration: "none",
                    }}
                  >
                    {item.rotulo}
                  </Link>
                );
              })}
            </nav>

            <div style={{ marginTop: "auto", paddingTop: "var(--espaco-lg)", borderTop: "1px solid var(--cor-border-light)" }}>
              <div style={{ fontSize: "11px", color: "var(--cor-muted)", marginBottom: "8px" }}>
                Papel: <strong>{personaAtiva.rotulo}</strong>
              </div>
              <button
                onClick={() => {
                  setMenuMobileAberto(false);
                  setBuscaAberta(true);
                }}
                className="btn-secondary"
                style={{ width: "100%", justifyContent: "center", fontSize: "12px", borderRadius: "var(--radius-xs)" }}
              >
                Buscar (⌘K)
              </button>
            </div>
          </div>
        </div>
      )}

      <BuscaRapidaModal aberto={buscaAberta} aoFechar={() => setBuscaAberta(false)} />

      <style jsx global>{`
        @media (max-width: 768px) {
          .nav-desktop {
            display: none !important;
          }
          .btn-mobile-toggle {
            display: block !important;
          }
          .search-text-label {
            display: none !important;
          }
          .persona-name-label {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
