"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BLOCOS,
  PARCELAS_MES,
  PayloadDiagnostico,
  ROTULOS_FONTE,
  ROTULOS_PARCELA,
  ValorCampo,
  chaveMes,
} from "@/lib/diagnostico/campos";
import { campoVisivel, MIN_MOTIVO } from "@/lib/diagnostico/regras";
import {
  FalhaApi,
  ROTULOS_STATUS_DIAGNOSTICO,
  chamarApi,
  formatarCentavos,
  formatarData,
  formatarMesCurto,
  formatarValorCampo,
  rotuloOpcao,
} from "@/lib/diagnostico/cliente";
import { CamposBloco, NUMEROS, blocoDoCampo } from "@/components/diagnostico/aluno/CamposBloco";

type Status = "rascunho" | "enviado" | "congelado";

interface Diagnostico {
  status: Status;
  payload: PayloadDiagnostico;
  resumo: { media_6m_bruta?: number | null };
  enviadoEm: string | null;
  congeladoEm: string | null;
  corrigirAte: string | null;
  mesesReferencia: string[];
}

export default function MeuDiagnosticoPage() {
  const [diag, setDiag] = useState<Diagnostico | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<PayloadDiagnostico>({});
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<{ mensagem: string; campo?: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = () =>
    chamarApi<{ diagnostico: Diagnostico }>("/api/diagnostico")
      .then((r) => setDiag(r.diagnostico))
      .catch((e) => setErroCarga(e instanceof FalhaApi ? e.erro.mensagem : "Não foi possível carregar o placar."));

  useEffect(() => {
    carregar();
  }, []);

  const container: React.CSSProperties = { maxWidth: "760px", margin: "0 auto", padding: "var(--espaco-lg) 16px" };

  if (erroCarga) {
    return (
      <div style={container}>
        <div className="adm-alerta-erro" role="alert">
          {erroCarga}
        </div>
      </div>
    );
  }
  if (!diag) {
    return (
      <div style={container} aria-busy="true">
        <p style={{ color: "var(--cor-muted)" }}>Carregando o placar…</p>
      </div>
    );
  }

  if (diag.status === "rascunho") {
    return (
      <div style={container}>
        <div className="card" style={{ padding: "var(--espaco-xl)" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "var(--espaco-sm)" }}>Placar de entrada</h1>
          <p style={{ marginBottom: "var(--espaco-lg)" }}>
            Seu placar ainda não foi enviado. O que você já preencheu está salvo.
          </p>
          <Link href="/onboarding/diagnostico" className="btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
            Continuar placar
          </Link>
        </div>
      </div>
    );
  }

  const abrirCorrecao = () => {
    setRascunho({ ...diag.payload });
    setMotivo("");
    setErro(null);
    setAviso(null);
    setEditando(true);
  };

  const alterar = (chave: string, valor: ValorCampo) => {
    setRascunho((atual) => {
      const novo = { ...atual };
      if (valor === undefined || valor === null) delete novo[chave];
      else novo[chave] = valor;
      return novo;
    });
  };

  const salvarCorrecao = async () => {
    setErro(null);
    if (motivo.trim().length < MIN_MOTIVO) {
      setErro({ mensagem: `Explique a correção em pelo menos ${MIN_MOTIVO} caracteres.`, campo: "motivo" });
      return;
    }
    setSalvando(true);
    try {
      const r = await chamarApi<{ diagnostico: Diagnostico }>("/api/diagnostico/corrigir", {
        method: "POST",
        body: JSON.stringify({ campos: rascunho, motivo: motivo.trim() }),
      });
      setDiag(r.diagnostico);
      setEditando(false);
      setAviso("Correção salva.");
    } catch (e) {
      if (e instanceof FalhaApi) {
        if (e.status === 409 && e.erro.codigo === "congelado") {
          setEditando(false);
          setAviso(e.erro.mensagem);
          carregar();
        } else {
          setErro({ mensagem: e.erro.mensagem, campo: e.erro.campo });
          const destino = blocoDoCampo(e.erro.campo);
          if (destino) document.getElementById(`bloco-${destino}`)?.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        setErro({ mensagem: "Sem conexão. Tente de novo." });
      }
    } finally {
      setSalvando(false);
    }
  };

  const media = diag.resumo?.media_6m_bruta ?? null;

  return (
    <div style={container}>
      <h1 style={{ fontSize: "26px", marginBottom: "var(--espaco-xs)" }}>Placar de entrada</h1>
      <p style={{ color: "var(--cor-muted)", fontSize: "14px", marginBottom: "var(--espaco-lg)" }}>
        {ROTULOS_STATUS_DIAGNOSTICO[diag.status]} em {formatarData(diag.enviadoEm)}
        {diag.status === "congelado" && " · congelado, correções só pela coordenação"}
      </p>

      <div aria-live="polite">
        {aviso && (
          <div className="card" style={{ padding: "10px 14px", marginBottom: "var(--espaco-lg)", fontSize: "14px" }}>
            {aviso}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: "var(--espaco-lg)", marginBottom: "var(--espaco-lg)" }}>
        <span style={{ color: "var(--cor-muted)", fontSize: "14px" }}>Média mensal dos últimos 6 meses</span>
        <div style={{ ...NUMEROS, fontSize: "30px", fontWeight: 700 }}>{media === null ? "Não informado" : formatarCentavos(media)}</div>
        {diag.corrigirAte && !editando && (
          <button type="button" className="btn-secondary" onClick={abrirCorrecao} style={{ marginTop: "var(--espaco-md)", minHeight: "44px" }}>
            Corrigir até {formatarData(diag.corrigirAte)}
          </button>
        )}
        <div style={{ marginTop: "var(--espaco-md)" }}>
          <a href="/api/diagnostico/export" className="btn-secondary" style={{ display: "inline-flex", textDecoration: "none", minHeight: "44px", alignItems: "center" }}>
            Exportar placar (.zip)
          </a>
        </div>
      </div>

      <SecaoComprovantes congelado={diag.status === "congelado"} />

      {editando ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvarCorrecao();
          }}
          noValidate
        >
          <div aria-live="assertive">
            {erro && (
              <div className="adm-alerta-erro" role="alert">
                {erro.mensagem}
              </div>
            )}
          </div>
          {BLOCOS.map((b) => (
            <section key={b.numero} id={`bloco-${b.numero}`} className="card" style={{ padding: "var(--espaco-lg)", marginBottom: "var(--espaco-md)" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "var(--espaco-md)" }}>
                <span style={NUMEROS}>{b.numero}.</span> {b.titulo}
              </h2>
              <CamposBloco bloco={b} payload={rascunho} onChange={alterar} mesesReferencia={diag.mesesReferencia} campoComErro={erro?.campo ?? null} />
            </section>
          ))}
          <div className="card adm-campo" style={{ padding: "var(--espaco-lg)" }}>
            <label htmlFor="motivo-correcao" style={{ fontSize: "15px", fontWeight: 600 }}>
              O que mudou e por quê
            </label>
            <textarea
              id="motivo-correcao"
              className="adm-input"
              style={{ minWidth: 0 }}
              rows={3}
              value={motivo}
              maxLength={500}
              aria-invalid={erro?.campo === "motivo" || undefined}
              placeholder="Conferi o extrato e agosto estava errado."
              onChange={(e) => setMotivo(e.target.value)}
            />
            <div style={{ display: "flex", gap: "var(--espaco-sm)", marginTop: "var(--espaco-md)" }}>
              <button type="button" className="btn-secondary" onClick={() => setEditando(false)} disabled={salvando} style={{ minHeight: "44px" }}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={salvando} style={{ flex: 1, minHeight: "44px" }}>
                {salvando ? "Salvando…" : "Salvar correção"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        BLOCOS.map((b) => (
          <section key={b.numero} className="card" style={{ padding: "var(--espaco-lg)", marginBottom: "var(--espaco-md)" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "var(--espaco-md)" }}>
              <span style={NUMEROS}>{b.numero}.</span> {b.titulo}
            </h2>
            {b.numero === 2 ? (
              <ResumoMeses payload={diag.payload} meses={diag.mesesReferencia} />
            ) : (
              <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--espaco-sm)" }}>
                {b.campos
                  .filter((c) => campoVisivel(c, diag.payload))
                  .map((c) => (
                    <div key={c.id}>
                      <dt style={{ fontSize: "13px", color: "var(--cor-muted)" }}>{c.rotulo}</dt>
                      <dd style={{ margin: 0, fontSize: "15px", whiteSpace: "pre-wrap", ...(c.tipo === "centavos" ? NUMEROS : {}) }}>
                        {formatarValorCampo(c.id, c.tipo, diag.payload[c.id])}
                      </dd>
                    </div>
                  ))}
              </dl>
            )}
          </section>
        ))
      )}
    </div>
  );
}

interface ComprovantePlacar {
  id: string;
  nome_arquivo: string;
  tamanho_bytes: number | null;
  criado_em: string;
}

function formatarTamanho(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb >= 100 ? Math.round(kb) : kb.toFixed(1).replace(".", ",")} KB`;
  const mb = kb / 1024;
  return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1).replace(".", ",")} MB`;
}

function SecaoComprovantes({ congelado }: { congelado: boolean }) {
  const [itens, setItens] = useState<ComprovantePlacar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = () =>
    fetch("/api/diagnostico/comprovantes", { cache: "no-store" })
      .then(async (r) => {
        const dados = await r.json();
        if (!r.ok || !dados.sucesso) throw new Error(dados?.erro?.mensagem || dados?.erro || "Falha ao carregar.");
        setItens(dados.comprovantes || []);
      })
      .catch((e) => setErro(e?.message || "Não foi possível carregar os comprovantes."))
      .finally(() => setCarregando(false));

  useEffect(() => {
    carregar();
  }, []);

  const enviarArquivo = async (file: File) => {
    setEnviando(true);
    setErro(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bucket", "comprovantes");
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const upDados = await up.json();
      if (!up.ok || !upDados.sucesso) throw new Error(upDados.erro || "Falha no envio.");
      const vinc = await fetch("/api/diagnostico/comprovantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath: upDados.storagePath,
          nomeArquivo: file.name.slice(0, 200),
          tamanhoBytes: file.size,
        }),
      });
      const vincDados = await vinc.json();
      if (!vinc.ok || !vincDados.sucesso) throw new Error(vincDados?.erro?.mensagem || vincDados?.erro || "Falha ao vincular.");
      await carregar();
    } catch (e: any) {
      setErro(e?.message || "Não foi possível enviar o comprovante.");
    } finally {
      setEnviando(false);
    }
  };

  const remover = async (id: string) => {
    if (removendoId || !confirm("Remover este comprovante do placar?")) return;
    setRemovendoId(id);
    setErro(null);
    try {
      const r = await fetch("/api/diagnostico/comprovantes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const dados = await r.json();
      if (!r.ok || !dados.sucesso) throw new Error(dados?.erro?.mensagem || dados?.erro || "Falha ao remover.");
      await carregar();
    } catch (e: any) {
      setErro(e?.message || "Não foi possível remover.");
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <section className="card" aria-labelledby="placar-comprovantes" style={{ padding: "var(--espaco-lg)", marginBottom: "var(--espaco-lg)" }}>
      <h2 id="placar-comprovantes" style={{ fontSize: "18px", marginBottom: "4px" }}>Comprovantes</h2>
      <p style={{ color: "var(--cor-muted)", fontSize: "13px", marginBottom: "var(--espaco-md)" }}>
        Extratos e arquivos que sustentam os números do placar. Entram no pacote exportado (.zip).
      </p>

      {erro && (
        <div className="adm-alerta-erro" role="alert" style={{ marginBottom: "var(--espaco-sm)" }}>
          {erro}
        </div>
      )}

      {carregando ? (
        <p style={{ color: "var(--cor-muted)", fontSize: "13px" }}>Carregando comprovantes…</p>
      ) : itens.length === 0 ? (
        <p style={{ color: "var(--cor-muted)", fontSize: "13px", marginBottom: "var(--espaco-md)" }}>
          Nenhum comprovante enviado ainda.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: "0 0 var(--espaco-md)", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {itens.map((item) => (
            <li key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--cor-border-light)", paddingBottom: "8px", fontSize: "14px" }}>
              <span>{item.nome_arquivo} <span style={{ color: "var(--cor-muted)", fontSize: "12px" }}>· {formatarTamanho(item.tamanho_bytes)}</span></span>
              {!congelado && (
                <button type="button" className="btn-secondary btn-sm" onClick={() => remover(item.id)} disabled={removendoId === item.id}>
                  {removendoId === item.id ? "Removendo…" : "Remover"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {congelado ? (
        <p style={{ color: "var(--cor-muted)", fontSize: "13px" }}>Placar congelado: comprovantes só pela coordenação.</p>
      ) : (
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: 600 }}>
          Enviar mais comprovantes (PDF, PNG, JPG, ZIP até 25 MB)
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.zip"
            disabled={enviando}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) enviarArquivo(file);
            }}
          />
        </label>
      )}
      {enviando && <p style={{ color: "var(--cor-muted)", fontSize: "13px" }}>Enviando…</p>}
    </section>
  );
}

function ResumoMeses({ payload, meses }: { payload: PayloadDiagnostico; meses: string[] }) {
  if (payload.placar_nao_sei === true) {
    return <p style={{ margin: "0 0 var(--espaco-sm)", fontSize: "14px" }}>Marcado: não sei o meu placar.</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", ...NUMEROS }}>
        <caption className="sr-only">Faturamento declarado por mês</caption>
        <thead>
          <tr>
            <th scope="col" style={{ textAlign: "left", padding: "6px" }}>Mês</th>
            {PARCELAS_MES.map((p) => (
              <th key={p} scope="col" style={{ textAlign: "right", padding: "6px", fontWeight: 600 }}>
                {ROTULOS_PARCELA[p].split(" (")[0].split(" /")[0]}
              </th>
            ))}
            <th scope="col" style={{ textAlign: "left", padding: "6px" }}>Fonte</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((ref, i) => {
            const n = i + 1;
            const fonte = payload[chaveMes(n, "fonte")];
            return (
              <tr key={ref} style={{ borderTop: "1px solid var(--cor-border-light)" }}>
                <th scope="row" style={{ textAlign: "left", padding: "6px", fontWeight: 500 }}>{formatarMesCurto(ref)}</th>
                {PARCELAS_MES.map((p) => {
                  const v = payload[chaveMes(n, p)];
                  return (
                    <td key={p} style={{ textAlign: "right", padding: "6px" }}>
                      {typeof v === "number" ? formatarCentavos(v) : "—"}
                    </td>
                  );
                })}
                <td style={{ padding: "6px" }}>{typeof fonte === "string" ? ROTULOS_FONTE[fonte as keyof typeof ROTULOS_FONTE] ?? fonte : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
