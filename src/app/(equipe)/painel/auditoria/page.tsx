"use client";

import React, { useState } from "react";
import { FilaAuditoria } from "@/components/equipe/FilaAuditoria";
import { TabelaHistoricoAuditoria } from "@/components/equipe/TabelaHistoricoAuditoria";
import { VisualizadorEntrega } from "@/components/equipe/VisualizadorEntrega";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { EntregaPendente } from "@/lib/api/auditoria";
import { useSistemaStore } from "@/lib/store/sistema-store";

export default function PainelAuditoriaPage() {
  const { estado, auditarEntrega, carregado } = useSistemaStore();
  const [entregaSelecionada, setEntregaSelecionada] = useState<EntregaPendente | null>(null);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  if (!carregado) return null;

  const mostrarToast = (msg: string) => {
    setToastMensagem(msg);
    setTimeout(() => setToastMensagem(null), 4000);
  };

  const handleAprovar = (id: string) => {
    const alvo = estado.entregas.find((e) => e.id === id);
    if (!alvo) return;

    auditarEntrega(id, "aprovado");
    setEntregaSelecionada(null);
    mostrarToast(`Entrega de ${alvo.alunoNome} aprovada.`);
  };

  const handleSolicitarAjuste = (id: string, motivo: string) => {
    const alvo = estado.entregas.find((e) => e.id === id);
    if (!alvo) return;

    auditarEntrega(id, "ajuste_solicitado", motivo);
    setEntregaSelecionada(null);
    mostrarToast(`Ajuste solicitado para ${alvo.alunoNome}.`);
  };

  const entregasAguardando = estado.entregas.filter((e) => e.status === "aguardando_avaliacao");
  const entregasAvaliadas = estado.entregas.filter((e) => e.status !== "aguardando_avaliacao");

  const abasAuditoria: TabItem[] = [
    {
      id: "pendentes",
      label: "Aguardando Avaliação",
      badge: entregasAguardando.length,
      content: (
        <FilaAuditoria
          entregas={entregasAguardando}
          onSelecionar={(e) => setEntregaSelecionada(e)}
        />
      ),
    },
    {
      id: "historico",
      label: "Histórico Avaliado",
      badge: entregasAvaliadas.length,
      content: (
        <TabelaHistoricoAuditoria
          entregas={entregasAvaliadas}
          onSelecionar={(e) => setEntregaSelecionada(e)}
        />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <div style={{ marginBottom: "var(--espaco-lg)" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Esteira de Auditoria de Entregas</h1>
        <p style={{ color: "var(--cor-muted)" }}>
          Validação pelo Anjo (Ana Carolina) e Concierge (Flávio): confira prints, teste links e aprove ou solicite ajustes.
        </p>
      </div>

      {toastMensagem && (
        <div style={{
          backgroundColor: "#ecfdf5",
          border: "1px solid #a7f3d0",
          color: "#065f46",
          padding: "12px 16px",
          borderRadius: "var(--radius-sm)",
          marginBottom: "var(--espaco-md)",
          fontWeight: 500,
        }}>
          {toastMensagem}
        </div>
      )}

      {entregaSelecionada ? (
        <VisualizadorEntrega
          entrega={entregaSelecionada}
          onAprovar={handleAprovar}
          onSolicitarAjuste={handleSolicitarAjuste}
          onVoltar={() => setEntregaSelecionada(null)}
        />
      ) : (
        <Tabs
          tabs={abasAuditoria}
          defaultTabId="pendentes"
          ariaLabel="Visões da esteira de auditoria de entregas"
        />
      )}
    </div>
  );
}
