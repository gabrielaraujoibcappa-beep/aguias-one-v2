"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FalhaApi, ROTULOS_TIPO_ANJO, chamarApi, formatarData } from "@/lib/diagnostico/cliente";
import {
  MAX_EVIDENCIA,
  MAX_HORARIO,
  MAX_PECA,
  ROTULOS_STATUS_PLANO,
  STATUS_PLANO,
  TIPOS_PLANO,
  type StatusPlano,
  type TipoPlano,
} from "@/lib/acompanhamento/plano";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { notificar } from "@/lib/notificacoes";

interface FormPlano {
  tipo: TipoPlano | "";
  peca1: string;
  evidencia1: string;
  data1: string;
  peca2: string;
  cadenciaDias: number;
  horarioReal: string;
  status: StatusPlano;
}

const VAZIO: FormPlano = {
  tipo: "",
  peca1: "",
  evidencia1: "",
  data1: "",
  peca2: "",
  cadenciaDias: 30,
  horarioReal: "",
  status: "rascunho",
};

const AJUDA_TIPO: Record<TipoPlano, string> = {
  A_nada: "Nada de pé: começa pela peça mais barata de levantar.",
  B_estrutura_sem_venda: "Estrutura existe, venda não: a peça é uma porta nova.",
  C_vendeu_sem_sobrar: "Vende, mas não sobra: preço escrito e caixa separado.",
  D_vida: "A vida em cima: plano mínimo, cadência longa.",
};

function mensagem(err: unknown): string {
  if (err instanceof FalhaApi) {
    if (err.status === 403) return "Seu papel não edita o plano. Só o Anjo escreve o plano dos 6 meses.";
    return err.erro.mensagem;
  }
  return "Não foi possível concluir.";
}

export default function PlanoAnjoPage({ params }: { params: { matricula: string } }) {
  const matriculaId = params.matricula;
  const { estado } = useSistemaStore();
  const podeEditarPapel = estado.papelAtual === "anjo";

  const [form, setForm] = useState<FormPlano>(VAZIO);
  const [nome, setNome] = useState("");
  const [tipoT0, setTipoT0] = useState<string | null>(null);
  const [existe, setExiste] = useState(false);
  const [statusSalvo, setStatusSalvo] = useState<StatusPlano | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroCampo, setErroCampo] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [ficha, resp] = await Promise.all([
          chamarApi<any>(`/api/diagnostico/${encodeURIComponent(matriculaId)}`),
          chamarApi<{ plano: any }>(`/api/anjo/plano/${encodeURIComponent(matriculaId)}`),
        ]);
        if (!ativo) return;
        setNome(ficha.aluno?.nome ?? "");
        const t0 = ficha.diagnostico?.scores?.anjo_tipo_t0 ?? null;
        setTipoT0(t0);
        if (resp.plano) {
          const p = resp.plano;
          setExiste(true);
          setStatusSalvo(p.status);
          setAtualizadoEm(p.atualizadoEm ?? p.criadoEm ?? null);
          setForm({
            tipo: p.tipo,
            peca1: p.peca1,
            evidencia1: p.evidencia1,
            data1: p.data1,
            peca2: p.peca2 ?? "",
            cadenciaDias: p.cadenciaDias,
            horarioReal: p.horarioReal ?? "",
            status: p.status,
          });
        } else if (t0 && (TIPOS_PLANO as readonly string[]).includes(t0)) {
          setForm((f) => ({ ...f, tipo: t0 as TipoPlano }));
        }
      } catch (err) {
        if (ativo) setErro(mensagem(err));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [matriculaId]);

  const encerrado = statusSalvo === "encerrado";
  const somenteLeitura = encerrado || !podeEditarPapel;
  const set = <K extends keyof FormPlano>(k: K, v: FormPlano[K]) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (somenteLeitura) return;
    setSalvando(true);
    setErro(null);
    setErroCampo(null);
    try {
      const resp = await chamarApi<{ plano: any }>(`/api/anjo/plano/${encodeURIComponent(matriculaId)}`, {
        method: "PUT",
        body: JSON.stringify({ ...form, peca2: form.peca2 || null, horarioReal: form.horarioReal || null }),
      });
      setExiste(true);
      setStatusSalvo(resp.plano.status);
      setAtualizadoEm(resp.plano.atualizadoEm);
      notificar(resp.plano.status === "ativo" ? "Plano salvo e ativo. O aluno vê no painel dele." : "Plano salvo.");
    } catch (err) {
      setErro(mensagem(err));
      if (err instanceof FalhaApi && err.erro.campo) {
        setErroCampo(err.erro.campo);
        document.getElementById(`plano-${err.erro.campo}`)?.focus();
      }
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="adm-pagina">
        <p role="status" style={{ color: "var(--cor-muted)" }}>Carregando o plano…</p>
      </div>
    );
  }

  const campoProps = (id: string) => ({
    id: `plano-${id}`,
    "aria-invalid": erroCampo === id || undefined,
    disabled: somenteLeitura,
    className: "adm-input",
    style: { minWidth: 0, width: "100%" } as React.CSSProperties,
  });

  return (
    <div className="adm-pagina" style={{ maxWidth: "760px" }}>
      <Link href={`/anjo/${matriculaId}`} style={{ color: "var(--cor-muted)", fontSize: "14px", textDecoration: "none" }}>
        ← Voltar à ficha
      </Link>

      <header className="adm-cabecalho" style={{ marginTop: "var(--espaco-md)" }}>
        <div>
          <h1 className="adm-titulo">Plano dos 6 meses</h1>
          <p className="adm-subtitulo" style={{ overflowWrap: "anywhere" }}>
            {nome || "Mentorado"}
            {tipoT0 ? ` · tipo no dia 1: ${ROTULOS_TIPO_ANJO[tipoT0 as keyof typeof ROTULOS_TIPO_ANJO] ?? tipoT0}` : ""}
            {atualizadoEm ? ` · atualizado em ${formatarData(atualizadoEm)}` : ""}
          </p>
        </div>
      </header>

      {encerrado && (
        <p className="adm-alerta-erro" role="status">
          Plano encerrado: só leitura.
        </p>
      )}
      {!podeEditarPapel && !encerrado && (
        <p style={{ color: "var(--cor-muted)", fontSize: "13px" }}>Só o Anjo escreve o plano. Você está vendo em modo leitura.</p>
      )}
      {erro && (
        <p className="adm-alerta-erro" role="alert" aria-live="assertive">
          {erro}
        </p>
      )}

      <form onSubmit={salvar} className="card" style={{ padding: "var(--espaco-lg)", display: "grid", gap: "var(--espaco-lg)" }} noValidate>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }} disabled={somenteLeitura}>
          <legend className="adm-rotulo" style={{ marginBottom: "var(--espaco-sm)" }}>
            Tipo
          </legend>
          <div role="radiogroup" id="plano-tipo" tabIndex={-1} style={{ display: "grid", gap: "8px" }}>
            {TIPOS_PLANO.map((t) => (
              <label key={t} style={{ display: "flex", gap: "8px", alignItems: "flex-start", cursor: somenteLeitura ? "default" : "pointer" }}>
                <input type="radio" name="tipo" value={t} checked={form.tipo === t} onChange={() => set("tipo", t)} style={{ marginTop: "3px" }} />
                <span>
                  <strong>{ROTULOS_TIPO_ANJO[t]}</strong>
                  <span style={{ display: "block", fontSize: "13px", color: "var(--cor-muted)" }}>{AJUDA_TIPO[t]}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">Peça 1 (a que sai primeiro)</span>
          <input {...campoProps("peca1")} maxLength={MAX_PECA} value={form.peca1} onChange={(e) => set("peca1", e.target.value)} />
        </label>

        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">Evidência da peça 1 (o que o Anjo vai ver)</span>
          <textarea
            {...campoProps("evidencia1")}
            rows={3}
            maxLength={MAX_EVIDENCIA}
            value={form.evidencia1}
            onChange={(e) => set("evidencia1", e.target.value)}
          />
        </label>

        <div style={{ display: "grid", gap: "var(--espaco-md)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <label className="adm-campo" style={{ minWidth: 0 }}>
            <span className="adm-rotulo">Data da peça 1</span>
            <input {...campoProps("data1")} type="date" value={form.data1} onChange={(e) => set("data1", e.target.value)} />
          </label>
          <label className="adm-campo" style={{ minWidth: 0 }}>
            <span className="adm-rotulo">Cadência de mensagem (dias)</span>
            <input
              {...campoProps("cadenciaDias")}
              type="number"
              inputMode="numeric"
              min={1}
              max={365}
              value={form.cadenciaDias}
              onChange={(e) => set("cadenciaDias", Number(e.target.value))}
            />
          </label>
        </div>

        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">Peça 2 (opcional)</span>
          <input {...campoProps("peca2")} maxLength={MAX_PECA} value={form.peca2} onChange={(e) => set("peca2", e.target.value)} />
        </label>

        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">Horário real da semana (opcional)</span>
          <input
            {...campoProps("horarioReal")}
            maxLength={MAX_HORARIO}
            placeholder="Terça, 7h às 8h"
            value={form.horarioReal}
            onChange={(e) => set("horarioReal", e.target.value)}
          />
        </label>

        <label className="adm-campo" style={{ minWidth: 0 }}>
          <span className="adm-rotulo">Status</span>
          <select {...campoProps("status")} value={form.status} onChange={(e) => set("status", e.target.value as StatusPlano)}>
            {STATUS_PLANO.map((s) => (
              <option key={s} value={s}>
                {ROTULOS_STATUS_PLANO[s]}
              </option>
            ))}
          </select>
          {form.status === "encerrado" && !encerrado && (
            <span style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Depois de salvar como encerrado, o plano não pode mais ser alterado.</span>
          )}
        </label>

        {!somenteLeitura && (
          <div className="btn-group btn-group-right">
            <Link href={`/anjo/${matriculaId}`} className="btn-secondary btn-md" style={{ textDecoration: "none" }}>
              Cancelar
            </Link>
            <button type="submit" className="btn-primary btn-md" disabled={salvando}>
              {salvando ? "Salvando…" : existe ? "Salvar plano" : "Criar plano"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
