"use client";

import React, { useState } from "react";
import { isStaff, type PapelUsuario } from "@/lib/auth/roles";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { notificar } from "@/lib/notificacoes";

export interface FiltrosExport {
  moduloId?: string;
  decisao?: string;
  from?: string;
  to?: string;
}

export function montarUrlExport(matriculaId: string, filtros: FiltrosExport = {}): string {
  const params = new URLSearchParams({ matriculaId });
  if (filtros.moduloId) params.set("moduloId", filtros.moduloId);
  if (filtros.decisao) params.set("decisao", filtros.decisao);
  if (filtros.from) params.set("from", filtros.from);
  if (filtros.to) params.set("to", filtros.to);
  return `/api/auditoria/export?${params.toString()}`;
}

/** Export é leitura (equipe incl. Anjo); parecer continua restrito a canAudit. Alinha botão à rota. */
export function podeExibirExport(papel: PapelUsuario): boolean {
  return isStaff(papel);
}

export function BotaoExportDossie({ matriculaId, filtros = {} }: { matriculaId: string; filtros?: FiltrosExport }) {
  const { estado } = useSistemaStore();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  if (!podeExibirExport(estado.papelAtual)) return null;

  const exportar = async () => {
    setCarregando(true);
    setErro("");
    try {
      const res = await fetch(montarUrlExport(matriculaId, filtros));
      if (!res.ok) {
        const corpo = await res.json().catch(() => null);
        throw new Error(corpo?.erro ?? "Não foi possível gerar o dossiê.");
      }
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("Dossiê vazio para os filtros aplicados.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dossie-${matriculaId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notificar("Dossiê PDF gerado com sucesso.");
    } catch (e: any) {
      setErro(e?.message ?? "Falha ao exportar.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: "4px" }}>
      <button
        type="button"
        onClick={exportar}
        disabled={carregando}
        className="btn-secondary"
        aria-live="polite"
        style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)", opacity: carregando ? 0.6 : 1 }}
      >
        {carregando ? "Gerando dossiê…" : "Exportar dossiê PDF"}
      </button>
      {erro && (
        <span role="alert" style={{ fontSize: "12px", color: "#991b1b" }}>
          {erro}
        </span>
      )}
    </span>
  );
}
