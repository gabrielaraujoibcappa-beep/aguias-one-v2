import React from "react";
import { FalhaApi } from "@/lib/diagnostico/cliente";

/** Mensagem de erro padronizada das telas do Mentor (403 → papel sem acesso). */
export function mensagemDeErro(err: unknown): string {
  if (err instanceof FalhaApi) {
    if (err.status === 403) return "Seu papel não acessa esta tela.";
    if (err.status === 401) return "Sua sessão expirou. Entre novamente.";
    return err.erro.mensagem;
  }
  return "Não foi possível carregar os dados.";
}

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div role="status" aria-live="polite" className="adm-vazio">
      <p style={{ margin: 0 }}>{texto}</p>
    </div>
  );
}

export function Vazio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="adm-vazio">
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
    </div>
  );
}

export function SeletorTurma({
  turmas,
  valor,
  aoMudar,
}: {
  turmas: { id: string; nome: string }[];
  valor: string;
  aoMudar: (id: string) => void;
}) {
  if (!turmas.length) return null;
  return (
    <label className="adm-campo" style={{ minWidth: 0 }}>
      <span className="adm-rotulo">Turma</span>
      <select className="adm-input" style={{ minWidth: 0 }} value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
