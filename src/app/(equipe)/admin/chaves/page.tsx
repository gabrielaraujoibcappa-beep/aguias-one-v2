"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";
import { ModalConfirmacaoDestrutiva } from "@/components/ui/ModalConfirmacaoDestrutiva";

interface ChaveApi {
  id: string;
  nome: string;
  prefixo: string;
  escopos: string[];
  expiraEm: string | null;
  revogadaEm: string | null;
  ultimoUsoEm: string | null;
  criadoEm: string;
}

const OPCOES_EXPIRACAO = [
  { valor: 90, rotulo: "90 dias (recomendado)" },
  { valor: 30, rotulo: "30 dias" },
  { valor: 365, rotulo: "1 ano" },
  { valor: 0, rotulo: "Sem expiração" },
];

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminChavesPage() {
  const [chaves, setChaves] = useState<ChaveApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semPermissao, setSemPermissao] = useState(false);

  // Prompt de geração (modal): o usuário informa nome + expiração antes de gerar.
  const [promptAberto, setPromptAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [expiraDias, setExpiraDias] = useState(90);
  const [gerando, setGerando] = useState(false);
  const [erroPrompt, setErroPrompt] = useState<string | null>(null);
  const inputNomeRef = useRef<HTMLInputElement>(null);

  // Segredo exibido UMA única vez após gerar.
  const [segredo, setSegredo] = useState<{ nome: string; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [revogando, setRevogando] = useState<ChaveApi | null>(null);
  const [confirmandoRevogar, setConfirmandoRevogar] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    setSemPermissao(false);
    try {
      const resp = await fetch("/api/chaves");
      const dados = await resp.json();
      if (resp.status === 403 || resp.status === 401) {
        setSemPermissao(true);
        return;
      }
      if (!dados.sucesso) throw new Error(dados.erro || "Falha ao carregar.");
      setChaves(dados.chaves || []);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar as chaves.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Prompt: foco no nome ao abrir, Escape fecha.
  useEffect(() => {
    if (!promptAberto) return;
    setErroPrompt(null);
    const t = setTimeout(() => inputNomeRef.current?.focus(), 40);
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !gerando) setPromptAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      clearTimeout(t);
    };
  }, [promptAberto, gerando]);

  const abrirPrompt = () => {
    setNome("");
    setExpiraDias(90);
    setErroPrompt(null);
    setSegredo(null);
    setCopiado(false);
    setPromptAberto(true);
  };

  const handleGerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gerando) return;
    if (nome.trim().length < 3) {
      setErroPrompt("Dê um nome à chave com pelo menos 3 caracteres (ex: “n8n – resgate”).");
      inputNomeRef.current?.focus();
      return;
    }
    setGerando(true);
    setErroPrompt(null);
    try {
      const resp = await fetch("/api/chaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), expiraDias }),
      });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error(dados.erro || "Falha ao gerar chave.");
      setSegredo({ nome: dados.chave.nome, texto: dados.textoClaro });
      setPromptAberto(false);
      await carregar();
    } catch (err: unknown) {
      setErroPrompt(err instanceof Error ? err.message : "Não foi possível gerar a chave.");
    } finally {
      setGerando(false);
    }
  };

  const handleCopiar = async () => {
    if (!segredo) return;
    try {
      await navigator.clipboard.writeText(segredo.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro("Não foi possível copiar. Selecione o texto manualmente.");
    }
  };

  const handleRevogar = async () => {
    if (!revogando || confirmandoRevogar) return;
    setConfirmandoRevogar(true);
    try {
      const resp = await fetch(`/api/chaves/${revogando.id}`, { method: "DELETE" });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error(dados.erro || "Falha ao revogar.");
      setRevogando(null);
      await carregar();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : "Não foi possível revogar a chave.");
      setRevogando(null);
    } finally {
      setConfirmandoRevogar(false);
    }
  };

  if (semPermissao) {
    return (
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Chaves de API</h1>
        <p style={{ color: "var(--cor-muted)" }}>Apenas Admin e Concierge gerenciam chaves do gateway.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", marginBottom: "var(--espaco-lg)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Chaves de API</h1>
          <p style={{ color: "var(--cor-muted)" }}>
            Gere chaves para operar o gateway (<code>/api/gateway</code>) em integrações como n8n e scripts.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={abrirPrompt}>
          + Gerar nova chave
        </button>
      </div>

      {erro && (
        <p role="alert" style={{ color: "#991b1b", backgroundColor: "#fef2f2", padding: "10px 14px", borderRadius: "var(--radius-xs)", marginBottom: "var(--espaco-md)", fontSize: "13px" }}>
          {erro}
        </p>
      )}

      {segredo && (
        <div className="card" role="alert" style={{ marginBottom: "var(--espaco-lg)", borderColor: "#f59e0b" }}>
          <strong style={{ display: "block", marginBottom: "6px" }}>Chave “{segredo.nome}” criada — copie agora</strong>
          <p style={{ color: "var(--cor-muted)", fontSize: "13px", margin: "0 0 10px 0" }}>
            Este segredo não será exibido novamente. Guarde em local seguro e use como{" "}
            <code>Authorization: Bearer …</code>.
          </p>
          <div style={{ display: "flex", gap: "8px", alignItems: "stretch", flexWrap: "wrap" }}>
            <code
              style={{
                flex: "1 1 320px",
                fontFamily: "var(--font-family-mono)",
                fontSize: "13px",
                backgroundColor: "#111827",
                color: "#f9fafb",
                padding: "10px 12px",
                borderRadius: "var(--radius-xs)",
                overflowX: "auto",
                userSelect: "all",
              }}
            >
              {segredo.texto}
            </code>
            <button type="button" className="btn-secondary" onClick={handleCopiar}>
              {copiado ? "Copiado!" : "Copiar"}
            </button>
            <button type="button" className="btn-tertiary" onClick={() => setSegredo(null)}>
              Já guardei
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {carregando ? (
          <EstadoCarregando texto="as chaves" variante="tabela" />
        ) : chaves.length === 0 ? (
          <p style={{ color: "var(--cor-muted)", fontSize: "13px" }}>
            Nenhuma chave ainda. Clique em “Gerar nova chave” e dê um nome no prompt.
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
                <th style={{ padding: "12px 8px" }}>Nome</th>
                <th style={{ padding: "12px 8px" }}>Prefixo</th>
                <th style={{ padding: "12px 8px" }}>Expira</th>
                <th style={{ padding: "12px 8px" }}>Último uso</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
                <th style={{ padding: "12px 8px" }}><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {chaves.map((c) => {
                const revogada = !!c.revogadaEm;
                return (
                  <tr key={c.id} style={{ borderBottom: "1px solid var(--cor-border-light)", opacity: revogada ? 0.6 : 1 }}>
                    <td style={{ padding: "14px 8px", fontWeight: 500 }}>{c.nome}</td>
                    <td style={{ padding: "14px 8px", fontFamily: "var(--font-family-mono)", fontSize: "13px" }}>{c.prefixo}…</td>
                    <td style={{ padding: "14px 8px" }}>{formatarData(c.expiraEm)}</td>
                    <td style={{ padding: "14px 8px" }}>{formatarData(c.ultimoUsoEm)}</td>
                    <td style={{ padding: "14px 8px" }}>{revogada ? "Revogada" : "Ativa"}</td>
                    <td style={{ padding: "14px 8px", textAlign: "right" }}>
                      {!revogada && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => setRevogando(c)}
                        >
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {promptAberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(10, 10, 11, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "var(--espaco-md, 16px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !gerando) setPromptAberto(false);
          }}
        >
          <form
            onSubmit={handleGerar}
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-chave-titulo"
            style={{
              backgroundColor: "#ffffff",
              color: "var(--cor-ink, #111827)",
              width: "100%",
              maxWidth: "460px",
              borderRadius: "var(--radius-md, 12px)",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
            }}
          >
            <h2 id="prompt-chave-titulo" style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px 0" }}>
              Gerar nova chave de API
            </h2>
            <p style={{ fontSize: "14px", color: "#4b5563", margin: "0 0 16px 0" }}>
              Dê um nome para identificar o uso (ex: “n8n – resgate”). O segredo aparece uma única vez.
            </p>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, marginBottom: "12px" }}>
              Nome da chave
              <input
                ref={inputNomeRef}
                className="adm-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: n8n – resgate"
                maxLength={60}
                autoComplete="off"
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
              Expiração
              <select
                className="adm-input"
                value={expiraDias}
                onChange={(e) => setExpiraDias(Number(e.target.value))}
              >
                {OPCOES_EXPIRACAO.map((o) => (
                  <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                ))}
              </select>
            </label>

            {erroPrompt && (
              <p role="alert" style={{ color: "#991b1b", backgroundColor: "#fef2f2", padding: "8px 12px", borderRadius: "var(--radius-xs)", fontSize: "13px", margin: "0 0 12px 0" }}>
                {erroPrompt}
              </p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPromptAberto(false)}
                disabled={gerando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={gerando || nome.trim().length < 3}
              >
                {gerando ? "Gerando..." : "Gerar chave"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ModalConfirmacaoDestrutiva
        aberto={revogando !== null}
        titulo="Revogar chave de API"
        objetoNome={revogando?.nome}
        mensagem="Integrações que usam esta chave param de funcionar na hora. Só revogue se a chave vazou ou não é mais usada."
        rotuloAcao="Revogar chave"
        carregando={confirmandoRevogar}
        onConfirmar={handleRevogar}
        onCancelar={() => {
          if (!confirmandoRevogar) setRevogando(null);
        }}
      />
    </div>
  );
}
