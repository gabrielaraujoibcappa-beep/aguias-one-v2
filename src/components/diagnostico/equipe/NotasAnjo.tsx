"use client";

import React, { useState } from "react";
import { FalhaApi, chamarApi, formatarDataHora } from "@/lib/diagnostico/cliente";

export interface NotaAnjo {
  id: string;
  corpo: string;
  criadoEm: string;
  autor: string;
  autorPapel: string | null;
}

interface Props {
  matriculaId: string;
  notas: NotaAnjo[];
  podeEscrever: boolean;
}

/** Notas append-only: sem editar, sem apagar. */
export function NotasAnjo({ matriculaId, notas: iniciais, podeEscrever }: Props) {
  const [notas, setNotas] = useState<NotaAnjo[]>(iniciais);
  const [corpo, setCorpo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (corpo.trim().length < 3) {
      setErro("A nota precisa ter pelo menos 3 caracteres.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const res = await chamarApi<{ nota: NotaAnjo }>(`/api/anjo/notas/${matriculaId}`, {
        method: "POST",
        body: JSON.stringify({ corpo }),
      });
      setNotas((atual) => [res.nota, ...atual]);
      setCorpo("");
    } catch (err) {
      setErro(err instanceof FalhaApi ? err.message : "Não foi possível gravar a nota.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      {podeEscrever && (
        <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-sm)", marginBottom: "var(--espaco-lg)" }}>
          <label htmlFor="nova-nota-anjo" className="adm-rotulo">
            Nova nota
          </label>
          <textarea
            id="nova-nota-anjo"
            className="adm-input"
            style={{ minWidth: 0, minHeight: "90px", resize: "vertical" }}
            maxLength={4000}
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            placeholder="O que você viu e o que combinou. A nota não pode ser editada depois."
          />
          {erro && <p className="adm-alerta-erro" role="alert" style={{ margin: 0 }}>{erro}</p>}
          <div>
            <button type="submit" className="btn-primary btn-sm" disabled={salvando}>
              {salvando ? "Gravando…" : "Gravar nota"}
            </button>
          </div>
        </form>
      )}

      {notas.length === 0 ? (
        <p style={{ color: "var(--cor-muted)", fontSize: "13px", margin: 0 }}>Nenhuma nota ainda.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
          {notas.map((n) => (
            <li key={n.id} style={{ borderLeft: "3px solid var(--cor-hairline)", paddingLeft: "var(--espaco-md)" }}>
              <div style={{ fontSize: "12px", color: "var(--cor-muted)", marginBottom: "4px" }}>
                {n.autor} · {formatarDataHora(n.criadoEm)}
              </div>
              <div style={{ fontSize: "14px", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{n.corpo}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
