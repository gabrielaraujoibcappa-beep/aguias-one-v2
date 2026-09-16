"use client";

import React from "react";
import { TelaAcessoBloqueado } from "@/components/TelaAcessoBloqueado";
import { useSistemaStore } from "@/lib/store/sistema-store";

export default function AcessoBloqueadoPage() {
  const { carregado, bloqueioAlunoAtual } = useSistemaStore();
  if (!carregado) return null;
  return <TelaAcessoBloqueado bloqueio={bloqueioAlunoAtual} />;
}
