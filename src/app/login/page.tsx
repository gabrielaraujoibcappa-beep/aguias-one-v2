"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { supabase } from "@/lib/supabase/client";
import {
  CONTAS_DEMO,
  MODO_DEMO,
  encerrarSessao,
  gravarTokenSessao,
  iniciarSessaoDemo,
  obterUsuarioLogado,
} from "@/lib/auth/sessao-cliente";
import { IconCheckCircle, IconAlertCircle } from "@/components/ui/Icons";

export default function LoginPage() {
  const router = useRouter();
  const { mudarPapel } = useSistemaStore();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /** Com a sessão já gravada em cookie, busca o papel no servidor e redireciona. */
  const concluirLogin = async () => {
    const usuario = await obterUsuarioLogado();
    if (!usuario) {
      await encerrarSessao();
      throw new Error("Conta sem perfil ativo no sistema. Fale com o Concierge.");
    }

    mudarPapel(usuario.papel);

    const destino = new URLSearchParams(window.location.search).get("redirect");
    const destinoSeguro = destino && destino.startsWith("/") && !destino.startsWith("//") ? destino : null;
    router.replace(destinoSeguro ?? (usuario.papel === "mentorado" ? "/dashboard" : "/painel/turma"));
  };

  const executarLogin = async (emailAlvo: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailAlvo.trim().toLowerCase(),
        password: senha,
      });
      if (error || !data.session) {
        throw new Error("Email ou senha inválidos. Por favor verifique seus dados.");
      }
      gravarTokenSessao(data.session.access_token, data.session.expires_in);
      await concluirLogin();
    } catch (err: any) {
      setErro(err.message || "Ocorreu um erro ao realizar o login.");
    } finally {
      setCarregando(false);
    }
  };

  const entrarComContaDemo = async (conta: (typeof CONTAS_DEMO)[number]) => {
    setCarregando(true);
    setErro(null);
    try {
      await supabase.auth.signOut().catch(() => {});
      iniciarSessaoDemo(conta.email);
      await concluirLogin();
    } catch (err: any) {
      setErro(err.message || "Não foi possível entrar com a conta de demonstração.");
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErro("Por favor informe um endereço de email válido.");
      return;
    }
    if (!senha) {
      setErro("Por favor informe sua senha.");
      return;
    }
    await executarLogin(email);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "var(--espaco-xl) var(--espaco-md)",
        backgroundColor: "var(--cor-dark-deep, #0a0a0b)",
        backgroundImage:
          "radial-gradient(circle at 50% 10%, rgba(0, 194, 255, 0.12) 0%, transparent 60%)",
        color: "#ffffff",
        fontFamily: "var(--font-family-ui)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          display: "flex",
          flexDirection: "column",
          gap: "var(--espaco-lg)",
        }}
      >
        {/* Logomarca Oficial em Destaque */}
        <div style={{ textAlign: "center", marginBottom: "var(--espaco-xs)" }}>
          <Link href="/" title="ÁGUIAS ONE" style={{ display: "inline-block", textDecoration: "none" }}>
            <img
              src="/logo-aguias-one.png"
              alt="ÁGUIAS ONE Mentoria"
              style={{
                height: "52px",
                maxWidth: "280px",
                objectFit: "contain",
                marginBottom: "8px",
              }}
            />
          </Link>
          <div
            style={{
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              fontFamily: "var(--font-family-mono)",
            }}
          >
            IBCAPPA · UniBCAPPA — Negócios Periciais
          </div>
        </div>

        {/* Card do Formulário de Acesso */}
        <div
          style={{
            backgroundColor: "var(--cor-canvas, #ffffff)",
            color: "var(--cor-ink, #111827)",
            borderRadius: "var(--radius-md, 14px)",
            padding: "32px 28px",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
            border: "1px solid var(--cor-border-light, #e5e7eb)",
          }}
        >
          <div style={{ marginBottom: "var(--espaco-lg)" }}>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--cor-primary, #111827)",
                marginBottom: "4px",
                letterSpacing: "-0.5px",
              }}
            >
              Acessar Sistema
            </h1>
            <p style={{ fontSize: "13px", color: "var(--cor-text-muted, #4b5563)", lineHeight: 1.4 }}>
              Informe suas credenciais para entrar na plataforma de acompanhamento.
            </p>
          </div>

          {/* Mensagem de Erro com role="alert" */}
          {erro && (
            <div
              role="alert"
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                borderRadius: "var(--radius-xs, 4px)",
                padding: "10px 12px",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "var(--espaco-md)",
              }}
            >
              <IconAlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Campo Email Normal */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--cor-primary, #111827)",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com.br"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  borderRadius: "var(--radius-xs, 4px)",
                  border: "1px solid var(--cor-border-light, #e5e7eb)",
                  backgroundColor: "#ffffff",
                  color: "var(--cor-ink, #111827)",
                  outline: "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--cor-action-vibrant, #0052ff)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 82, 255, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--cor-border-light, #e5e7eb)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Campo Senha */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label
                  htmlFor="senha"
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--cor-primary, #111827)",
                  }}
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--cor-action-vibrant, #0052ff)",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "14px",
                  borderRadius: "var(--radius-xs, 4px)",
                  border: "1px solid var(--cor-border-light, #e5e7eb)",
                  backgroundColor: "#ffffff",
                  color: "var(--cor-ink, #111827)",
                  outline: "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--cor-action-vibrant, #0052ff)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 82, 255, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--cor-border-light, #e5e7eb)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Lembrar-me e Esqueci Senha */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--cor-text-muted, #4b5563)" }}>
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  style={{ accentColor: "var(--cor-action-vibrant, #0052ff)" }}
                />
                <span>Lembrar de mim</span>
              </label>

              <span
                style={{
                  color: "var(--cor-action-vibrant, #0052ff)",
                  fontSize: "12px",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
                onClick={() => alert("Para recuperar seu acesso, favor contatar o Concierge pelo WhatsApp.")}
              >
                Esqueceu a senha?
              </span>
            </div>

            {/* Botão de Envio Primário */}
            <button
              type="submit"
              disabled={carregando}
              className="btn-primary"
              aria-busy={carregando}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
                marginTop: "6px",
                borderRadius: "var(--radius-xs, 4px)",
                cursor: carregando ? "not-allowed" : "pointer",
                opacity: carregando ? 0.75 : 1,
              }}
            >
              {carregando ? "Autenticando..." : "Entrar no ÁGUIAS ONE"}
            </button>
          </form>

          {/* Login demo sem senha: somente em desenvolvimento (NODE_ENV=development) */}
          {MODO_DEMO && (
          <>
          {/* Divisor Visual */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "24px 0 16px 0",
              color: "var(--cor-muted, #6b7280)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--cor-border-light, #e5e7eb)" }} />
            <span style={{ padding: "0 10px" }}>Demonstração · apenas em desenvolvimento</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--cor-border-light, #e5e7eb)" }} />
          </div>

          {/* Atalhos com 1 clique para as Personas Cadastradas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {CONTAS_DEMO.map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => entrarComContaDemo(c)}
                disabled={carregando}
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius-xs, 4px)",
                  border: email === c.email ? "1px solid var(--cor-action-vibrant, #0052ff)" : "1px solid var(--cor-border-light, #e5e7eb)",
                  backgroundColor: email === c.email ? "rgba(0, 82, 255, 0.06)" : "var(--cor-soft-stone, #f5f6f8)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--cor-primary, #111827)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.nome}
                </div>
                <div style={{ fontSize: "10px", color: "var(--cor-text-muted, #4b5563)" }}>
                  {c.cargo}
                </div>
              </button>
            ))}
          </div>
          </>
          )}
        </div>

        {/* Rodapé Seguro e Suporte */}
        <div style={{ textAlign: "center", fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
          <span>Dúvidas ou dificuldades de acesso? </span>
          <a
            href="https://wa.me/5511987654321?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20para%20acessar%20o%20%C3%81GUIAS%20ONE"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--cor-action-glow, #00c2ff)", textDecoration: "none", fontWeight: 500 }}
          >
            Fale com o Concierge no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
