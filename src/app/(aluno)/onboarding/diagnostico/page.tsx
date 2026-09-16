"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BLOCOS, PayloadDiagnostico, TEXTO_ABERTURA, TEXTO_ENVIADO, ValorCampo } from "@/lib/diagnostico/campos";
import { FalhaApi, chamarApi, formatarCentavos } from "@/lib/diagnostico/cliente";
import { CamposBloco, NUMEROS, blocoDoCampo } from "@/components/diagnostico/aluno/CamposBloco";

interface RespostaDiagnostico {
  diagnostico: {
    status: "rascunho" | "enviado" | "congelado";
    payload: PayloadDiagnostico;
    resumo: { media_6m_bruta?: number | null };
    mesesReferencia: string[];
  };
}

export default function WizardDiagnosticoPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [payload, setPayload] = useState<PayloadDiagnostico>({});
  const [meses, setMeses] = useState<string[]>([]);
  // 0 = abertura; 1..8 = blocos
  const [passo, setPasso] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<{ mensagem: string; campo?: string } | null>(null);
  const [enviado, setEnviado] = useState<{ media: number | null } | null>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    chamarApi<RespostaDiagnostico>("/api/diagnostico")
      .then(({ diagnostico }) => {
        if (diagnostico.status !== "rascunho") {
          router.replace("/diagnostico");
          return;
        }
        setPayload(diagnostico.payload || {});
        setMeses(diagnostico.mesesReferencia || []);
        setCarregando(false);
      })
      .catch((e) => {
        setErro({ mensagem: e instanceof FalhaApi ? e.erro.mensagem : "Não foi possível carregar o placar." });
        setCarregando(false);
      });
  }, [router]);

  useEffect(() => {
    tituloRef.current?.focus();
  }, [passo, enviado]);

  const alterar = (chave: string, valor: ValorCampo) => {
    setPayload((atual) => {
      const novo = { ...atual };
      if (valor === undefined || valor === null) delete novo[chave];
      else novo[chave] = valor;
      return novo;
    });
    if (erro?.campo === chave) setErro(null);
  };

  const total = BLOCOS.length;
  const bloco = passo > 0 ? BLOCOS[passo - 1] : null;

  const salvarRascunho = async () => {
    const r = await chamarApi<RespostaDiagnostico>("/api/diagnostico", {
      method: "PUT",
      body: JSON.stringify({ campos: payload }),
    });
    return r.diagnostico;
  };

  const avancar = async () => {
    setErro(null);
    setSalvando(true);
    try {
      if (passo < total) {
        await salvarRascunho();
        setPasso(passo + 1);
        window.scrollTo({ top: 0 });
      } else {
        const r = await chamarApi<RespostaDiagnostico>("/api/diagnostico/enviar", {
          method: "POST",
          body: JSON.stringify({ campos: payload }),
        });
        setEnviado({ media: r.diagnostico.resumo?.media_6m_bruta ?? null });
        window.scrollTo({ top: 0 });
      }
    } catch (e) {
      if (e instanceof FalhaApi) {
        if (e.status === 409) {
          router.replace("/diagnostico");
          return;
        }
        setErro({ mensagem: e.erro.mensagem, campo: e.erro.campo });
        const destino = blocoDoCampo(e.erro.campo);
        if (destino && destino !== passo) setPasso(destino);
      } else {
        setErro({ mensagem: "Sem conexão. Suas respostas continuam aqui; tente de novo." });
      }
    } finally {
      setSalvando(false);
    }
  };

  const voltar = () => {
    setErro(null);
    setPasso(Math.max(0, passo - 1));
    window.scrollTo({ top: 0 });
  };

  const container: React.CSSProperties = { maxWidth: "680px", margin: "0 auto", padding: "var(--espaco-lg) 16px" };

  if (carregando) {
    return (
      <div style={container} aria-busy="true">
        <p style={{ color: "var(--cor-muted)" }}>Carregando o placar…</p>
      </div>
    );
  }

  if (enviado) {
    return (
      <div style={container}>
        <div className="card" style={{ padding: "var(--espaco-xl)" }}>
          <h1 ref={tituloRef} tabIndex={-1} style={{ fontSize: "24px", marginBottom: "var(--espaco-sm)" }}>
            Placar enviado
          </h1>
          <p style={{ fontSize: "16px", marginBottom: "var(--espaco-lg)" }}>{TEXTO_ENVIADO}</p>
          {enviado.media !== null && (
            <p style={{ marginBottom: "var(--espaco-lg)" }}>
              <span style={{ color: "var(--cor-muted)", fontSize: "14px" }}>Sua média dos últimos 6 meses</span>
              <br />
              <strong style={{ ...NUMEROS, fontSize: "28px" }}>{formatarCentavos(enviado.media)}</strong>
            </p>
          )}
          <Link href="/diagnostico" className="btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
            Ver meu placar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      {passo === 0 ? (
        <div className="card" style={{ padding: "var(--espaco-xl)" }}>
          <h1 ref={tituloRef} tabIndex={-1} style={{ fontSize: "26px", marginBottom: "var(--espaco-sm)" }}>
            Placar de entrada
          </h1>
          <p style={{ fontSize: "16px", lineHeight: 1.6, marginBottom: "var(--espaco-lg)" }}>{TEXTO_ABERTURA}</p>
          {erro && (
            <div className="adm-alerta-erro" role="alert">
              {erro.mensagem}
            </div>
          )}
          <button type="button" className="btn-primary" onClick={() => setPasso(1)} style={{ width: "100%", minHeight: "44px" }}>
            Começar
          </button>
        </div>
      ) : (
        bloco && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              avancar();
            }}
            noValidate
          >
            <div style={{ marginBottom: "var(--espaco-md)" }}>
              <p style={{ ...NUMEROS, fontSize: "13px", color: "var(--cor-muted)", margin: "0 0 6px" }}>
                <span className="sr-only">Bloco </span>
                {passo} de {total}
              </p>
              <div
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={total}
                aria-valuenow={passo}
                aria-label={`Bloco ${passo} de ${total}`}
                style={{ height: "4px", background: "var(--cor-border-light)", borderRadius: "var(--radius-pill)" }}
              >
                <div
                  style={{
                    width: `${(passo / total) * 100}%`,
                    height: "100%",
                    background: "var(--cor-action-blue)",
                    borderRadius: "var(--radius-pill)",
                  }}
                />
              </div>
            </div>

            <h1 ref={tituloRef} tabIndex={-1} style={{ fontSize: "22px", marginBottom: "var(--espaco-md)" }}>
              {bloco.titulo}
            </h1>

            <div aria-live="assertive">
              {erro && (
                <div className="adm-alerta-erro" role="alert">
                  {erro.mensagem}
                </div>
              )}
            </div>

            <CamposBloco
              bloco={bloco}
              payload={payload}
              onChange={alterar}
              mesesReferencia={meses}
              campoComErro={erro?.campo ?? null}
            />

            <div
              style={{
                display: "flex",
                gap: "var(--espaco-sm)",
                marginTop: "var(--espaco-xl)",
                position: "sticky",
                bottom: 0,
                background: "var(--cor-bg-page, var(--cor-canvas))",
                padding: "var(--espaco-sm) 0",
              }}
            >
              <button type="button" className="btn-secondary" onClick={voltar} disabled={salvando} style={{ minHeight: "44px" }}>
                Voltar
              </button>
              <button type="submit" className="btn-primary" disabled={salvando} style={{ flex: 1, minHeight: "44px" }}>
                {salvando ? "Salvando…" : passo === total ? "Enviar placar" : "Salvar e continuar"}
              </button>
            </div>
          </form>
        )
      )}
    </div>
  );
}
