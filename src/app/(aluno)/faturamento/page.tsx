"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FormularioFaturamento } from "@/components/faturamento/FormularioFaturamento";
import { TabelaHistoricoFaturamento } from "@/components/faturamento/TabelaHistoricoFaturamento";
import { MetaFaturamentoAnual } from "@/components/faturamento/MetaFaturamentoAnual";
import { lerEstadoSistema, useSistemaStore } from "@/lib/store/sistema-store";
import { formatarMoedaReal, obterMetaAnualAluno } from "@/lib/api/faturamento";
import { notificar } from "@/lib/notificacoes";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

export default function FaturamentoAlunoPage() {
  const router = useRouter();
  const {
    adicionarFaturamento,
    definirMetaFaturamentoAnual,
    reverterMetaFaturamento,
    faturamentosAlunoAtual,
    metaAnualAlunoAtual,
    alunoAtualId,
    carregado,
  } = useSistemaStore();

  if (!carregado) return <EstadoCarregando texto="seu faturamento" variante="pagina" />;

  const handleDefinirMeta = (valor: number) => {
    const anterior = lerEstadoSistema().metasFaturamentoAlunos[alunoAtualId];
    const valorAnteriorExibido = obterMetaAnualAluno(lerEstadoSistema().metasFaturamentoAlunos, alunoAtualId);
    // Gravação adiada: só vai ao servidor quando a janela de "Desfazer" termina
    const efetivar = definirMetaFaturamentoAnual(valor, alunoAtualId, { adiarPersistencia: true });
    const posterior = lerEstadoSistema().metasFaturamentoAlunos[alunoAtualId];
    if (anterior === posterior) return;

    notificar(`Sua meta anual foi alterada para ${formatarMoedaReal(posterior)}.`, {
      efetivar,
      desfazer: {
        rotulo: "Desfazer alteração",
        rotuloAcessivel: "Desfazer alteração da sua meta anual de faturamento",
        executar: () => reverterMetaFaturamento(alunoAtualId, anterior, posterior),
        mensagemAposDesfazer: `Alteração desfeita. Sua meta anual voltou para ${formatarMoedaReal(valorAnteriorExibido)}.`,
      },
    });
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <button
        onClick={() => router.push("/dashboard")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--cor-muted)",
          fontSize: "14px",
          marginBottom: "var(--espaco-md)",
          fontWeight: 500,
        }}
      >
        ← Voltar ao Dashboard
      </button>

      <div style={{ marginBottom: "var(--espaco-lg)" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Faturamento & Comprovantes</h1>
        <p style={{ color: "var(--cor-muted)" }}>
          Registro direto de faturamento bruto do escritório com upload de comprovantes ou pacotes compactados .zip.
        </p>
      </div>

      <MetaFaturamentoAnual
        faturamentos={faturamentosAlunoAtual}
        metaAnual={metaAnualAlunoAtual}
        onDefinirMeta={handleDefinirMeta}
      />

      <FormularioFaturamento onSalvar={adicionarFaturamento} />
      <TabelaHistoricoFaturamento historico={faturamentosAlunoAtual} />
    </div>
  );
}
