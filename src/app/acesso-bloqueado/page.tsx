"use client";

import React from "react";
import { TelaAcessoBloqueado } from "@/components/TelaAcessoBloqueado";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

export default function AcessoBloqueadoPage() {
  const { carregado, bloqueioAlunoAtual } = useSistemaStore();
  if (!carregado) return <EstadoCarregando texto="a situação do seu acesso" variante="formulario" />;
  return <TelaAcessoBloqueado bloqueio={bloqueioAlunoAtual} />;
}
