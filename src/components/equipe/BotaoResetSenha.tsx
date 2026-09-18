"use client";

import React, { useState } from "react";

interface BotaoResetSenhaProps {
  usuarioId: string;
  nomeAluno: string;
}

/**
 * Reset de senha do mentorado (uso da equipe, na ficha do aluno).
 * Gera senha temporária, marca troca obrigatória e exibe para repasse.
 */
export function BotaoResetSenha({ usuarioId, nomeAluno }: BotaoResetSenhaProps) {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const gerar = async () => {
    setCarregando(true);
    setErro(null);
    setSenha(null);
    try {
      const resp = await fetch("/api/admin/usuarios/reset-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId }),
      });
      const dados = await resp.json();
      if (!resp.ok || !dados.sucesso) throw new Error(dados.erro || "Falha ao redefinir.");
      setSenha(dados.senhaTemporaria);
    } catch (e: any) {
      setErro(e?.message || "Não foi possível redefinir a senha.");
    } finally {
      setCarregando(false);
    }
  };

  const copiar = async () => {
    if (!senha) return;
    try {
      await navigator.clipboard.writeText(senha);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível: a senha segue visível para repasse manual
    }
  };

  if (!aberto) {
    return (
      <button
        type="button"
        className="btn-secondary"
        style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)" }}
        onClick={() => {
          if (confirm(`Gerar nova senha temporária para ${nomeAluno}? A atual deixa de valer.`)) {
            setAberto(true);
            gerar();
          }
        }}
      >
        Resetar senha
      </button>
    );
  }

  return (
    <span
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        padding: "5px 12px",
        borderRadius: "var(--radius-xs)",
        border: "1px solid var(--cor-border-light)",
        backgroundColor: "var(--cor-soft-stone)",
      }}
    >
      {carregando ? (
        "Gerando…"
      ) : erro ? (
        <>
          {erro}
          <button type="button" className="btn-secondary btn-sm" onClick={() => setAberto(false)}>
            Fechar
          </button>
        </>
      ) : (
        <>
          Nova senha: <strong style={{ fontFamily: "var(--font-family-mono)" }}>{senha}</strong>
          <button type="button" className="btn-secondary btn-sm" onClick={copiar}>
            {copiado ? "Copiado!" : "Copiar"}
          </button>
          <button type="button" className="btn-secondary btn-sm" onClick={() => setAberto(false)}>
            Fechar
          </button>
        </>
      )}
    </span>
  );
}
