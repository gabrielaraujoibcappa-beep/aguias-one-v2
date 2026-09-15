import React from "react";
import Link from "next/link";
import { IconCheckCircle, IconGlobe, IconCurrency, IconArrowRight } from "../ui/Icons";

export interface ContextoDashboard {
  moduloLiberadoId: string;
  moduloLiberadoTitulo: string;
  checkinPendente: boolean;
  faturamentoMes: string;
}

export interface AtalhoDashboardItem {
  chave: "checkin" | "canais" | "faturamento";
  icone: React.ComponentType<{ size?: number }>;
  rotulo: string;
  titulo: string;
  statusBadge: string;
  statusAtencao: boolean;
  href: string;
  botaoTexto: string;
}

export function obterAtalhosDashboard(contexto: ContextoDashboard): AtalhoDashboardItem[] {
  return [
    {
      chave: "checkin",
      icone: IconCheckCircle,
      rotulo: "Entregas & Check-in",
      titulo: contexto.moduloLiberadoTitulo,
      statusBadge: contexto.checkinPendente ? "Pendente" : "Entregue",
      statusAtencao: contexto.checkinPendente,
      href: `/checkin/${contexto.moduloLiberadoId}`,
      botaoTexto: contexto.checkinPendente ? "Preencher Check-in" : "Ver Entrega",
    },
    {
      chave: "canais",
      icone: IconGlobe,
      rotulo: "Presença & Atração",
      titulo: "Canais do Escritório (WhatsApp, GMN, Ads)",
      statusBadge: "7 Canais",
      statusAtencao: false,
      href: "/canais",
      botaoTexto: "Gerenciar Canais",
    },
    {
      chave: "faturamento",
      icone: IconCurrency,
      rotulo: "Receita do Escritório",
      titulo: `Declaração de Faturamento (${contexto.faturamentoMes})`,
      statusBadge: "Mensal",
      statusAtencao: false,
      href: "/faturamento",
      botaoTexto: "Lançar Faturamento",
    },
  ];
}

export function AtalhosPrincipais({ contexto }: { contexto: ContextoDashboard }) {
  const atalhos = obterAtalhosDashboard(contexto);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "var(--espaco-lg)",
      marginBottom: "var(--espaco-xl)",
    }}>
      {atalhos.map((atalho) => {
        const IconComp = atalho.icone;
        return (
          <div
            key={atalho.chave}
            style={{
              backgroundColor: "#fff",
              border: "1px solid var(--cor-border-light)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--espaco-lg)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "border-color 0.15s ease",
            }}
          >
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--espaco-sm)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--cor-slate)" }}>
                  <IconComp size={15} />
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontFamily: "var(--font-family-mono)",
                  }}>
                    {atalho.rotulo}
                  </span>
                </div>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: "2px",
                  backgroundColor: atalho.statusAtencao ? "rgba(245, 158, 11, 0.1)" : "var(--cor-soft-stone)",
                  color: atalho.statusAtencao ? "#92400e" : "var(--cor-slate)",
                  fontFamily: "var(--font-family-mono)",
                }}>
                  {atalho.statusBadge}
                </span>
              </div>

              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "var(--espaco-xs)", color: "var(--cor-ink)" }}>
                {atalho.titulo}
              </h3>
            </div>

            <div style={{ marginTop: "var(--espaco-lg)" }}>
              <Link
                href={atalho.href}
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "13px",
                  borderRadius: "var(--radius-xs)",
                  padding: "8px 16px",
                }}
              >
                <span>{atalho.botaoTexto}</span>
                <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
