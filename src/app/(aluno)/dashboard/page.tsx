"use client";

import React from "react";
import { CardPerfilAluno } from "@/components/aluno/CardPerfilAluno";
import { PainelKpisAluno } from "@/components/aluno/PainelKpisAluno";
import { AtalhosPrincipais } from "@/components/aluno/AtalhosPrincipais";
import { SecaoMateriais } from "@/components/aluno/SecaoMateriais";
import { CardPlanoAnjo } from "@/components/aluno/CardPlanoAnjo";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { filtrarModulosVisiveis } from "@/lib/api/modulos-liberacao";
import { calcularMetaMensal, formatarMesReferencia, mesReferenciaAtual } from "@/lib/api/faturamento";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

export default function DashboardAlunoPage() {
  const { estado, carregado, faturamentosAlunoAtual, metaAnualAlunoAtual } = useSistemaStore();

  if (!carregado) return <EstadoCarregando texto="seu painel" variante="pagina" />;

  const modulosLiberados = filtrarModulosVisiveis(estado.modulos);
  // Sem módulo liberado ainda (turma nova ou dados carregando): nada é inventado
  const moduloAtual = modulosLiberados[modulosLiberados.length - 1];
  const tituloModulo = moduloAtual ? `Módulo ${moduloAtual.numero} — ${moduloAtual.titulo}` : "Nenhum módulo liberado ainda";
  const turma = estado.turmas.find((t) => t.nome === estado.usuarioAtual.turmaNome);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      {/* 1. Card de Identificação e Semáforo (o aluno não recebe a avaliação semanal da equipe) */}
      <CardPerfilAluno
        nome={estado.usuarioAtual.nome}
        turmaNome={estado.usuarioAtual.turmaNome}
        moduloAtualTitulo={tituloModulo}
      />

      {/* Plano dos 6 meses do Anjo (só quando ativo ou em reavaliação) */}
      <CardPlanoAnjo />

      {/* 2. Indicadores & Metas do Perito (KPIs 360) */}
      <PainelKpisAluno
        faturamentos={faturamentosAlunoAtual}
        canais={estado.canais}
        modulos={estado.modulos}
        entregas={estado.entregas}
        metaMensal={calcularMetaMensal(metaAnualAlunoAtual)}
        horarioEncontro={turma?.horarioEncontro || undefined}
      />

      {/* 3. Atalhos Centrais (Check-in, Canais, Faturamento) */}
      <AtalhosPrincipais
        contexto={{
          moduloLiberadoId: moduloAtual?.id ?? "atual",
          moduloLiberadoTitulo: tituloModulo,
          checkinPendente: moduloAtual?.status === "liberado",
          faturamentoMes: formatarMesReferencia(mesReferenciaAtual()).replace(" de ", "/"),
        }}
      />

      {/* 4. Materiais de Apoio e Roteiros */}
      <SecaoMateriais />
    </div>
  );
}
