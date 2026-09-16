import React from "react";

export interface TurmaOpcao {
  id: string;
  nome: string;
  codigo?: string;
}

export function SeletorTurma({ turmas, valor, onChange }: { turmas: TurmaOpcao[]; valor: string | null; onChange: (id: string) => void }) {
  if (turmas.length <= 1) return null;
  return (
    <div className="adm-campo">
      <label htmlFor="seletor-turma" className="adm-rotulo">
        Turma
      </label>
      <select id="seletor-turma" className="adm-input" style={{ minWidth: 0 }} value={valor ?? ""} onChange={(e) => onChange(e.target.value)}>
        {turmas.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
