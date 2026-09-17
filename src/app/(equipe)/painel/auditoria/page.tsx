"use client";

import React, { useState } from "react";
import { FilaAuditoria } from "@/components/equipe/FilaAuditoria";
import { TabelaHistoricoAuditoria } from "@/components/equipe/TabelaHistoricoAuditoria";
import { VisualizadorEntrega } from "@/components/equipe/VisualizadorEntrega";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { EntregaPendente } from "@/lib/api/auditoria";
import { lerEstadoSistema, useSistemaStore } from "@/lib/store/sistema-store";
import { notificar } from "@/lib/notificacoes";
import { canAudit } from "@/lib/auth/roles";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

export default function PainelAuditoriaPage() {
  const { estado, auditarEntrega, reverterEntrega, carregado } = useSistemaStore();
  const [entregaSelecionada, setEntregaSelecionada] = useState<EntregaPendente | null>(null);

  if (!carregado) return <EstadoCarregando texto="a fila de auditoria" variante="tabela" />;

  /**
   * A decisão aparece na hora e a entrega sai da fila, mas o envio ao backend só
   * acontece quando a janela de "Desfazer" termina. A API não aceita devolver uma
   * entrega para "aguardando avaliação", então adiar o envio é o que torna o
   * "Desfazer" real.
   */
  const auditarComDesfazer = (id: string, decisao: "aprovado" | "ajuste_solicitado", motivo?: string) => {
    const lista = lerEstadoSistema().entregas;
    const indice = lista.findIndex((e) => e.id === id);
    const anterior = lista[indice];
    if (!anterior) return;

    const efetivar = auditarEntrega(id, decisao, motivo, { adiarPersistencia: true });
    const posterior = lerEstadoSistema().entregas.find((e) => e.id === id);
    setEntregaSelecionada(null);

    const objeto = `entrega de ${anterior.alunoNome} no ${anterior.moduloTitulo}`;
    const aprovacao = decisao === "aprovado";
    const rotulo = aprovacao ? "Desfazer aprovação" : "Desfazer pedido de ajuste";

    notificar(aprovacao ? `Entrega de ${anterior.alunoNome} aprovada.` : `Ajuste solicitado na entrega de ${anterior.alunoNome}.`, {
      efetivar,
      desfazer: {
        rotulo,
        rotuloAcessivel: `${rotulo} da ${objeto}`,
        executar: () => reverterEntrega({ anterior, posterior, indice }),
        mensagemAposDesfazer:
          anterior.status === "aguardando_avaliacao"
            ? `${aprovacao ? "Aprovação desfeita" : "Pedido de ajuste desfeito"}. A entrega de ${anterior.alunoNome} voltou para a fila.`
            : `${aprovacao ? "Aprovação desfeita" : "Pedido de ajuste desfeito"}. A entrega de ${anterior.alunoNome} voltou à situação anterior.`,
      },
    });
  };

  const handleAprovar = (id: string) => auditarComDesfazer(id, "aprovado");

  const handleSolicitarAjuste = (id: string, motivo: string) => auditarComDesfazer(id, "ajuste_solicitado", motivo);

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
          Confira prints, teste links e aprove ou solicite ajustes. Avaliação feita por admin, concierge ou mentor.
        </p>
      </div>

      {entregaSelecionada ? (
        <VisualizadorEntrega
          entrega={entregaSelecionada}
          onAprovar={handleAprovar}
          onSolicitarAjuste={handleSolicitarAjuste}
          onVoltar={() => setEntregaSelecionada(null)}
          podeAuditar={canAudit(estado.papelAtual)}
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
