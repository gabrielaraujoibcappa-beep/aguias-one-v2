"use client";

import React, { useState } from "react";
import { CanalItem, salvarCanalEquipe } from "@/lib/api/canais";

interface EditorCanaisAlunoProps {
  matriculaId: string;
  nomeAluno: string;
  iniciais: CanalItem[];
}

/**
 * Editor de canais na visão do aluno (uso exclusivo da equipe).
 * Cada linha salva via POST /api/canais com a matrícula do aluno (upsert).
 */
export function EditorCanaisAluno({ matriculaId, nomeAluno, iniciais }: EditorCanaisAlunoProps) {
  const [canais, setCanais] = useState<CanalItem[]>(iniciais);
  const [urls, setUrls] = useState<Record<string, string>>(() =>
    Object.fromEntries(iniciais.map((c) => [c.nome, c.url || ""]))
  );
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const alternarStatus = (nome: string) => {
    setCanais((lista) =>
      lista.map((c) => (c.nome === nome ? { ...c, status: c.status === "ativo" ? "nao_iniciado" : "ativo" } : c))
    );
    setOk(null);
  };

  const salvar = async (nome: string) => {
    const canal = canais.find((c) => c.nome === nome);
    if (!canal || salvando) return;
    setSalvando(nome);
    setErro(null);
    setOk(null);
    const resultado = await salvarCanalEquipe({
      matriculaId,
      canalNome: nome,
      status: canal.status,
      urlCanal: (urls[nome] || "").trim(),
    });
    setSalvando(null);
    if (!resultado.sucesso) {
      setErro(resultado.erro || "Não foi possível salvar.");
      return;
    }
    setOk(`Canal "${nome}" salvo.`);
  };

  return (
    <section id="secao-canais" className="card" aria-labelledby="editor-canais-titulo" style={{ marginBottom: "var(--espaco-lg)" }}>
      <h2 id="editor-canais-titulo" style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
        Canais de {nomeAluno}
      </h2>
      <p style={{ color: "var(--cor-muted)", fontSize: "13px", marginBottom: "var(--espaco-md)" }}>
        Edição da equipe: ativa o canal e registra a URL em nome do aluno.
      </p>

      {erro && (
        <p role="alert" style={{ color: "#991b1b", backgroundColor: "#fef2f2", padding: "8px 12px", borderRadius: "var(--radius-xs)", fontSize: "13px", marginBottom: "var(--espaco-sm)" }}>
          {erro}
        </p>
      )}
      {ok && (
        <p role="status" style={{ color: "#166534", backgroundColor: "#f0fdf4", padding: "8px 12px", borderRadius: "var(--radius-xs)", fontSize: "13px", marginBottom: "var(--espaco-sm)" }}>
          {ok}
        </p>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
            <th style={{ padding: "8px" }}>Canal</th>
            <th style={{ padding: "8px" }}>Status</th>
            <th style={{ padding: "8px" }}>URL</th>
            <th style={{ padding: "8px" }}><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {canais.map((canal) => (
            <tr key={canal.nome} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
              <td style={{ padding: "10px 8px", fontWeight: 500 }}>{canal.nome}</td>
              <td style={{ padding: "10px 8px" }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => alternarStatus(canal.nome)}
                  aria-pressed={canal.status === "ativo"}
                >
                  {canal.status === "ativo" ? "Ativo" : "Não iniciado"}
                </button>
              </td>
              <td style={{ padding: "10px 8px" }}>
                <input
                  className="adm-input"
                  value={urls[canal.nome] || ""}
                  onChange={(e) => setUrls((u) => ({ ...u, [canal.nome]: e.target.value }))}
                  placeholder="https://..."
                  inputMode="url"
                  style={{ width: "100%", minWidth: "180px" }}
                />
              </td>
              <td style={{ padding: "10px 8px", textAlign: "right" }}>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => salvar(canal.nome)}
                  disabled={salvando === canal.nome}
                >
                  {salvando === canal.nome ? "Salvando..." : "Salvar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
