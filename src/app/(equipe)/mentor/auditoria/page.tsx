"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Carregando, Vazio, mensagemDeErro } from "@/components/diagnostico/mentor/EstadoTela";
import { baixarArquivo, chamarApi, formatarDataHora, gerarCsv } from "@/lib/diagnostico/cliente";
import { ROTULOS_PAPEL, type PapelUsuario } from "@/lib/auth/roles";

interface Linha {
  id: string;
  tipo: "evento" | "acesso";
  codigo: string;
  papel: string;
  quem: string;
  aluno: string | null;
  matriculaId: string | null;
  detalhe: Record<string, unknown>;
  em: string;
}

interface Resposta {
  de: string;
  ate: string;
  limite: number;
  truncado: boolean;
  linhas: Linha[];
}

type Tipo = "" | "eventos" | "acessos";

const hoje = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const ROTULOS_CODIGO: Record<string, string> = {
  "diagnostico.enviado": "Placar enviado",
  "diagnostico.atrasado": "Placar atrasado (T+48h)",
  "diagnostico.congelado": "Placar congelado",
  "diagnostico.corrigido": "Placar corrigido",
  "anjo.plano_ativo": "Plano do Anjo ativado",
  "anjo.lista_mes6": "Lista do mês 6 gerada",
  leitura_anjo_ficha: "Anjo abriu a ficha",
  leitura_icp_frases: "Leitura das frases ICP",
  mentor_ficha: "Leitura de dinheiro · ficha do Mentor",
  admin_ficha: "Leitura de dinheiro · ficha do Admin",
  concierge_aluno: "Leitura de dinheiro · ficha do Concierge",
  faturamentos_lista: "Leitura de dinheiro · lista de faturamentos",
  faturamentos_aluno: "Leitura de dinheiro · faturamentos do aluno",
};

function rotuloCodigo(c: string): string {
  if (ROTULOS_CODIGO[c]) return ROTULOS_CODIGO[c];
  const [base] = c.split(":");
  if (base.endsWith("_turma")) return "Leitura de dinheiro · lista da turma";
  if (base === "anjo_mes6") return "Leitura de dinheiro · lista do mês 6";
  return c;
}

function rotuloPapel(p: string): string {
  return ROTULOS_PAPEL[p as PapelUsuario] ?? (p === "sistema" ? "Sistema" : p);
}

export default function AuditoriaMentorPage() {
  const [de, setDe] = useState(diasAtras(30));
  const [ate, setAte] = useState(hoje());
  const [tipo, setTipo] = useState<Tipo>("");
  const [papel, setPapel] = useState("");
  const [busca, setBusca] = useState("");
  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const qs = new URLSearchParams({ de, ate });
      if (tipo) qs.set("origem", tipo);
      if (papel) qs.set("papel", papel);
      setDados(await chamarApi<Resposta>(`/api/mentor/auditoria?${qs.toString()}`));
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setCarregando(false);
    }
  }, [de, ate, tipo, papel]);

  useEffect(() => {
    carregar();
    // recarrega quando filtros de servidor mudam
  }, [carregar]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const linhas = dados?.linhas ?? [];
    if (termo.length < 2) return linhas;
    return linhas.filter((l) =>
      [l.quem, l.aluno ?? "", l.codigo, rotuloCodigo(l.codigo)].some((t) => t.toLowerCase().includes(termo))
    );
  }, [dados, busca]);

  const exportar = () => {
    const csv = gerarCsv(
      filtradas.map((l) => ({
        data_hora: l.em,
        tipo: l.tipo === "evento" ? "Evento" : "Acesso a dinheiro",
        o_que: rotuloCodigo(l.codigo),
        codigo: l.codigo,
        quem: l.quem,
        papel: rotuloPapel(l.papel),
        aluno: l.aluno ?? "",
        detalhe: Object.keys(l.detalhe).length ? JSON.stringify(l.detalhe) : "",
      }))
    );
    baixarArquivo(`auditoria-${de}-a-${ate}.csv`, csv);
  };

  const acessos = filtradas.filter((l) => l.tipo === "acesso").length;

  return (
    <div className="adm-pagina">
      <header className="adm-cabecalho">
        <div>
          <h1 className="adm-titulo">Auditoria de acessos</h1>
          <p className="adm-subtitulo">Quem leu dinheiro de quem, quando e de onde. Quem corrigiu, congelou ou ativou o quê.</p>
        </div>
        <button type="button" className="btn-secondary btn-md" onClick={exportar} disabled={!filtradas.length}>
          Exportar CSV
        </button>
      </header>

      <p style={{ color: "var(--cor-muted)", fontSize: "13px", margin: "0 0 var(--espaco-md)" }}>
        Log não pode ser apagado nem editado.
      </p>

      <div
        className="card"
        style={{
          padding: "var(--espaco-md)",
          marginBottom: "var(--espaco-lg)",
          display: "grid",
          gap: "var(--espaco-md)",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          alignItems: "end",
        }}
      >
        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">De</span>
          <input type="date" className="adm-input" style={{ minWidth: 0 }} value={de} max={ate} onChange={(e) => setDe(e.target.value)} />
        </label>
        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">Até</span>
          <input type="date" className="adm-input" style={{ minWidth: 0 }} value={ate} min={de} onChange={(e) => setAte(e.target.value)} />
        </label>
        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">Tipo</span>
          <select className="adm-input" style={{ minWidth: 0 }} value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)}>
            <option value="">Eventos e acessos</option>
            <option value="eventos">Só eventos</option>
            <option value="acessos">Só acessos a dinheiro</option>
          </select>
        </label>
        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">Papel de quem agiu</span>
          <select className="adm-input" style={{ minWidth: 0 }} value={papel} onChange={(e) => setPapel(e.target.value)}>
            <option value="">Todos</option>
            {(["admin", "mentor", "anjo", "concierge", "resgate", "mentorado", "sistema"] as const).map((p) => (
              <option key={p} value={p}>
                {rotuloPapel(p)}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">Buscar (nome ou ação)</span>
          <input type="search" className="adm-input" style={{ minWidth: 0 }} value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
      </div>

      {carregando && <Carregando texto="Carregando a auditoria…" />}
      {!carregando && erro && (
        <p className="adm-alerta-erro" role="alert">
          {erro}
        </p>
      )}

      {!carregando && !erro && dados && (
        <>
          <p style={{ fontSize: "13px", margin: "0 0 var(--espaco-sm)", fontVariantNumeric: "tabular-nums lining-nums" }} aria-live="polite">
            {filtradas.length} registro(s), {acessos} acesso(s) a dinheiro.
            {dados.truncado && ` Mostrando os ${dados.limite} mais recentes: reduza o período para ver tudo.`}
          </p>

          {filtradas.length === 0 ? (
            <Vazio titulo="Nada registrado no período" texto="Ajuste as datas ou os filtros." />
          ) : (
            <div className="card adm-card-sem-padding" style={{ overflowX: "auto" }}>
              <table className="adm-tabela" style={{ minWidth: "720px" }}>
                <caption className="sr-only">Registros de auditoria</caption>
                <thead>
                  <tr>
                    <th scope="col">Quando</th>
                    <th scope="col">O quê</th>
                    <th scope="col">Quem</th>
                    <th scope="col">Aluno</th>
                    <th scope="col">Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((l) => (
                    <tr key={l.id}>
                      <td style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums lining-nums" }}>{formatarDataHora(l.em)}</td>
                      <td>
                        <span className={`adm-chip ${l.tipo === "acesso" ? "justificada" : "neutro"}`}>
                          {l.tipo === "acesso" ? "Dinheiro" : "Evento"}
                        </span>{" "}
                        {rotuloCodigo(l.codigo)}
                      </td>
                      <td>
                        {l.quem}
                        <div style={{ fontSize: "12px", color: "var(--cor-muted)" }}>{rotuloPapel(l.papel)}</div>
                      </td>
                      <td>
                        {l.aluno && l.matriculaId ? <Link href={`/mentor/aluno/${l.matriculaId}`}>{l.aluno}</Link> : l.aluno ?? "Turma / geral"}
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--cor-muted)", maxWidth: "260px", overflowWrap: "anywhere" }}>
                        {typeof l.detalhe?.motivo === "string"
                          ? `Motivo: ${l.detalhe.motivo}`
                          : Object.keys(l.detalhe).length
                            ? Object.entries(l.detalhe)
                                .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                                .join(" · ")
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
