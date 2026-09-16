"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { encerrarSessao } from "@/lib/auth/sessao-cliente";
import { BloqueioAcesso, ROTULOS_MOTIVO_BLOQUEIO, formatarDataBloqueio } from "@/lib/api/bloqueio-acesso";

interface TelaAcessoBloqueadoProps {
  bloqueio?: BloqueioAcesso;
}

/** Tela exibida ao mentorado com acesso bloqueado. Substitui todo o shell do sistema. */
export function TelaAcessoBloqueado({ bloqueio }: TelaAcessoBloqueadoProps) {
  const router = useRouter();

  const sair = async () => {
    await encerrarSessao();
    router.push("/login");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--cor-dark-deep, #0a0a0b)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <section
        aria-labelledby="acesso-bloqueado-titulo"
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "var(--radius-md)",
          padding: "32px",
        }}
      >
        <img src="/logo-aguias-one.png" alt="ÁGUIAS ONE" style={{ height: "28px", objectFit: "contain", marginBottom: "24px" }} />

        <h1 id="acesso-bloqueado-titulo" style={{ fontSize: "22px", marginBottom: "8px", color: "#ffffff" }}>
          Acesso temporariamente bloqueado
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: 1.5, marginBottom: "20px" }}>
          Seu acesso ao sistema ÁGUIAS ONE foi bloqueado pela coordenação. Enquanto o bloqueio estiver ativo, as áreas da mentoria ficam indisponíveis.
        </p>

        {bloqueio && (
          <dl style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", margin: "0 0 24px 0", fontSize: "14px" }}>
            <div>
              <dt style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Motivo</dt>
              <dd style={{ fontWeight: 600 }}>{ROTULOS_MOTIVO_BLOQUEIO[bloqueio.motivo]}</dd>
            </div>
            {bloqueio.mensagemAoAluno && (
              <div>
                <dt style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Mensagem da coordenação</dt>
                <dd style={{ lineHeight: 1.5 }}>{bloqueio.mensagemAoAluno}</dd>
              </div>
            )}
            <div>
              <dt style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Bloqueado em</dt>
              <dd>{formatarDataBloqueio(bloqueio.bloqueadoEm)}</dd>
            </div>
            {bloqueio.liberarEm && (
              <div>
                <dt style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>Liberação automática prevista</dt>
                <dd>{formatarDataBloqueio(bloqueio.liberarEm)}</dd>
              </div>
            )}
          </dl>
        )}

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: 1.5, marginBottom: "24px" }}>
          Para regularizar a situação ou tirar dúvidas, procure a coordenação da UniBCAPPA pelo canal de atendimento habitual da turma.
        </p>

        <button type="button" onClick={sair} className="btn-secondary" style={{ fontSize: "13px", padding: "8px 16px", borderRadius: "var(--radius-xs)" }}>
          Sair da conta
        </button>
      </section>
    </main>
  );
}
