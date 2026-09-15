"use client";

import React from "react";
import { CardPerfilAluno } from "@/components/aluno/CardPerfilAluno";
import { PainelKpisAluno } from "@/components/aluno/PainelKpisAluno";
import { AtalhosPrincipais } from "@/components/aluno/AtalhosPrincipais";
import { SecaoMateriais } from "@/components/aluno/SecaoMateriais";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { filtrarModulosVisiveis } from "@/lib/api/modulos-liberacao";

export default function DashboardAlunoPage() {
  const { estado, carregado } = useSistemaStore();

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

      {/* 2. Indicadores & Metas do Perito (KPIs 360) */}
      <PainelKpisAluno
        faturamentos={estado.faturamentos}
        canais={estado.canais}
        modulos={estado.modulos}
        entregas={estado.entregas}
        semaforo="verde"
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
