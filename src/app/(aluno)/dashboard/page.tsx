"use client";

import React from "react";
import { CardPerfilAluno } from "@/components/aluno/CardPerfilAluno";
import { PainelKpisAluno } from "@/components/aluno/PainelKpisAluno";
import { AtalhosPrincipais } from "@/components/aluno/AtalhosPrincipais";
import { SecaoMateriais } from "@/components/aluno/SecaoMateriais";
import { CardPlanoAnjo } from "@/components/aluno/CardPlanoAnjo";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { filtrarModulosVisiveis } from "@/lib/api/modulos-liberacao";
import { calcularMetaMensal } from "@/lib/api/faturamento";

export default function DashboardAlunoPage() {
  const { estado, carregado, faturamentosAlunoAtual, metaAnualAlunoAtual } = useSistemaStore();

  if (!carregado) return null;

  const modulosLiberados = filtrarModulosVisiveis(estado.modulos);
  const moduloAtual = modulosLiberados[modulosLiberados.length - 1] || estado.modulos[0];

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      {/* 1. Card de Identificação e Semáforo */}
      <CardPerfilAluno
        nome={estado.usuarioAtual.nome}
        turmaNome={estado.usuarioAtual.turmaNome}
        semaforo="verde"
        moduloAtualTitulo={`Módulo ${moduloAtual.numero} — ${moduloAtual.titulo}`}
      />

      {/* Plano dos 6 meses do Anjo (só quando ativo ou em reavaliação) */}
      <CardPlanoAnjo />

      {/* 2. Indicadores & Metas do Perito (KPIs 360) */}
      <PainelKpisAluno
        faturamentos={faturamentosAlunoAtual}
        canais={estado.canais}
        modulos={estado.modulos}
        entregas={estado.entregas}
        semaforo="verde"
        metaMensal={calcularMetaMensal(metaAnualAlunoAtual)}
      />

      {/* 2. Atalhos Centrais (Check-in, Canais, Faturamento) */}
      <AtalhosPrincipais
        contexto={{
          moduloLiberadoId: moduloAtual.id,
          moduloLiberadoTitulo: `Módulo ${moduloAtual.numero} — ${moduloAtual.titulo}`,
          checkinPendente: moduloAtual.status === "liberado",
          faturamentoMes: "Setembro/2026",
        }}
      />

      {/* 3. Materiais de Apoio e Roteiros */}
      <SecaoMateriais />
    </div>
  );
}
