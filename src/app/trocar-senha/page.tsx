"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obterUsuarioLogado } from "@/lib/auth/sessao-cliente";

/** Primeiro acesso (ou pós-reset): senha temporária precisa ser substituída. */
export default function TrocarSenhaPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    obterUsuarioLogado()
      .then((u) => {
        if (!u) {
          router.replace("/login?redirect=/trocar-senha");
          return;
        }
        setNome(u.nome);
        if (!u.precisaTrocarSenha) router.replace("/");
      })
      .catch(() => router.replace("/login?redirect=/trocar-senha"));
  }, [router]);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (novaSenha.length < 6) {
      setErro("A nova senha deve conter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("A confirmação não confere com a nova senha.");
      return;
    }
    setSalvando(true);
    try {
      const resp = await fetch("/api/usuarios/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novaSenha }),
      });
      const dados = await resp.json();
      if (!resp.ok || !dados.sucesso) throw new Error(dados.erro || "Falha ao trocar a senha.");
      router.replace("/");
    } catch (err: any) {
      setErro(err?.message || "Não foi possível trocar a senha.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div style={{ maxWidth: "440px", margin: "0 auto", padding: "var(--espaco-xl) 16px" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "var(--espaco-xs)" }}>Crie sua senha</h1>
      <p style={{ color: "var(--cor-muted)", fontSize: "14px", marginBottom: "var(--espaco-lg)" }}>
        {nome ? `Olá, ${nome}. ` : ""}Você está com uma senha temporária — defina uma senha só sua para continuar.
      </p>

      {erro && (
        <div className="adm-alerta-erro" role="alert" style={{ marginBottom: "var(--espaco-md)" }}>
          {erro}
        </div>
      )}

      <form onSubmit={salvar} className="card" style={{ padding: "var(--espaco-lg)", display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
          Nova senha
          <input
            className="adm-input"
            type={mostrar ? "text" : "password"}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            style={{ minWidth: 0 }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
          Confirmar nova senha
          <input
            className="adm-input"
            type={mostrar ? "text" : "password"}
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            minLength={6}
            autoComplete="new-password"
            style={{ minWidth: 0 }}
          />
        </label>
        <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px" }}>
          <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} />
          Mostrar senhas
        </label>
        <button type="submit" className="btn-primary" disabled={salvando} style={{ minHeight: "44px" }}>
          {salvando ? "Salvando…" : "Salvar e entrar"}
        </button>
      </form>
    </div>
  );
}
