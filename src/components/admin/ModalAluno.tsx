"use client";

import React, { useState } from "react";
import { AlunoCadastro, validarDadosAluno } from "@/lib/api/alunos";

interface ModalAlunoProps {
  aberto: boolean;
  alunoInicial?: AlunoCadastro | null;
  turmas: { id: string; nome: string }[];
  onSalvar: (dados: AlunoCadastro) => void;
  onFechar: () => void;
}

export function ModalAluno({ aberto, alunoInicial, turmas, onSalvar, onFechar }: ModalAlunoProps) {
  const [nome, setNome] = useState(alunoInicial?.nome || "");
  const [email, setEmail] = useState(alunoInicial?.email || "");
  const [whatsapp, setWhatsapp] = useState(alunoInicial?.whatsapp || "");
  const [cpf, setCpf] = useState(alunoInicial?.cpf || "");
  const [areaPericial, setAreaPericial] = useState(alunoInicial?.areaPericial || "Contábil");
  const [turmaId, setTurmaId] = useState(alunoInicial?.turmaId || (turmas[0]?.id || ""));
  const [status, setStatus] = useState<AlunoCadastro["status"]>(alunoInicial?.status || "ativo");
  const [erros, setErros] = useState<string[]>([]);

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dados: AlunoCadastro = {
      id: alunoInicial?.id,
      nome,
      email,
      whatsapp,
      cpf,
      areaPericial,
      turmaId,
      status,
    };

    const validacao = validarDadosAluno(dados);
    if (!validacao.valido) {
      setErros(validacao.erros);
      return;
    }

    onSalvar(dados);
    onFechar();
  };

  return (
    <div className="modal-backdrop" style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div className="card" style={{
        width: "100%",
        maxWidth: "520px",
        backgroundColor: "var(--cor-canvas)",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-lg)" }}>
          <h3>{alunoInicial ? "Editar Aluno" : "Cadastrar Novo Aluno"}</h3>
          <button onClick={onFechar} style={{ fontSize: "18px", color: "var(--cor-muted)" }}>✕</button>
        </div>

        {erros.length > 0 && (
          <div style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "var(--cor-error)",
            padding: "var(--espaco-sm) var(--espaco-md)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--espaco-md)",
            fontSize: "13px",
          }}>
            Por favor, preencha corretamente os campos destacados.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Nome Completo *</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Dr. Roberto Alcantara"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-xs)",
                border: erros.includes("nome") ? "1px solid var(--cor-error)" : "1px solid var(--cor-border-light)",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--espaco-md)" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="perito@email.com"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-xs)",
                  border: erros.includes("email") ? "1px solid var(--cor-error)" : "1px solid var(--cor-border-light)",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>WhatsApp *</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-8888"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-xs)",
                  border: erros.includes("whatsapp") ? "1px solid var(--cor-error)" : "1px solid var(--cor-border-light)",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--espaco-md)" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Turma *</label>
              <select
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--cor-border-light)",
                  backgroundColor: "var(--cor-canvas)",
                }}
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Área Pericial</label>
              <input
                type="text"
                value={areaPericial}
                onChange={(e) => setAreaPericial(e.target.value)}
                placeholder="Ex: Contábil, Financeira"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--cor-border-light)",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--espaco-sm)", marginTop: "var(--espaco-md)" }}>
            <button type="button" className="btn-secondary" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar Aluno</button>
          </div>
        </form>
      </div>
    </div>
  );
}
