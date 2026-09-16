"use client";

import React, { useEffect, useState } from "react";
import {
  BLOCOS,
  BlocoDiagnostico,
  CampoDiagnostico,
  FONTES_MES,
  PARCELAS_MES,
  PayloadDiagnostico,
  ROTULOS_FONTE,
  ROTULOS_PARCELA,
  ValorCampo,
  chaveMes,
} from "@/lib/diagnostico/campos";
import { campoVisivel } from "@/lib/diagnostico/regras";
import { formatarCentavos, formatarMesCurto, parseCentavos } from "@/lib/diagnostico/cliente";

export const NUMEROS: React.CSSProperties = { fontVariantNumeric: "tabular-nums lining-nums" };

const INPUT: React.CSSProperties = { minWidth: 0 };

/** Número do bloco (1–8) que contém o campo_id; mes_* vai para o bloco 2. */
export function blocoDoCampo(campo?: string): number | null {
  if (!campo) return null;
  if (campo.startsWith("mes_") || campo === "placar_nao_sei") return 2;
  return BLOCOS.find((b) => b.campos.some((c) => c.id === campo))?.numero ?? null;
}

interface Props {
  bloco: BlocoDiagnostico;
  payload: PayloadDiagnostico;
  onChange: (chave: string, valor: ValorCampo) => void;
  mesesReferencia: string[];
  campoComErro?: string | null;
}

export function CamposBloco({ bloco, payload, onChange, mesesReferencia, campoComErro }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-lg)" }}>
      {bloco.instrucao && <p style={{ color: "var(--cor-muted)", fontSize: "14px", margin: 0 }}>{bloco.instrucao}</p>}
      {bloco.numero === 2 ? (
        <GradeMeses payload={payload} onChange={onChange} mesesReferencia={mesesReferencia} campoComErro={campoComErro} />
      ) : (
        bloco.campos
          .filter((c) => campoVisivel(c, payload))
          .map((c) => (
            <Campo key={c.id} campo={c} valor={payload[c.id]} onChange={(v) => onChange(c.id, v)} erro={campoComErro === c.id} />
          ))
      )}
    </div>
  );
}

const idDe = (campoId: string) => `diag-${campoId.replace(/[^a-z0-9_]/gi, "-")}`;

function Campo({
  campo,
  valor,
  onChange,
  erro,
}: {
  campo: CampoDiagnostico;
  valor: ValorCampo;
  onChange: (v: ValorCampo) => void;
  erro: boolean;
}) {
  const id = idDe(campo.id);
  const estiloGrupo: React.CSSProperties = {
    border: erro ? "1px solid var(--cor-error)" : "none",
    borderRadius: "var(--radius-sm)",
    padding: erro ? "var(--espaco-sm)" : 0,
    margin: 0,
    minWidth: 0,
  };
  const legenda = (
    <legend style={{ fontSize: "15px", fontWeight: 600, color: "var(--cor-ink)", marginBottom: "8px", padding: 0 }}>
      {campo.rotulo}
      {!campo.obrigatorio && <span style={{ fontWeight: 400, color: "var(--cor-muted)" }}> (opcional)</span>}
    </legend>
  );
  const ajuda = campo.ajuda && <p style={{ fontSize: "13px", color: "var(--cor-muted)", margin: "4px 0 0" }}>{campo.ajuda}</p>;

  if (campo.tipo === "bool") {
    return (
      <fieldset style={estiloGrupo} aria-invalid={erro || undefined}>
        {legenda}
        <div role="radiogroup" style={{ display: "flex", gap: "8px" }}>
          {[
            { v: true, r: "Sim" },
            { v: false, r: "Não" },
          ].map((o) => (
            <button
              key={o.r}
              type="button"
              role="radio"
              aria-checked={valor === o.v}
              onClick={() => onChange(o.v)}
              className={valor === o.v ? "btn-primary" : "btn-secondary"}
              style={{ flex: 1, minHeight: "44px" }}
            >
              {o.r}
            </button>
          ))}
        </div>
        {ajuda}
      </fieldset>
    );
  }

  if (campo.tipo === "enum" && campo.id === "uf") {
    return (
      <div className="adm-campo">
        <label htmlFor={id} style={{ fontSize: "15px", fontWeight: 600 }}>
          {campo.rotulo}
        </label>
        <select
          id={id}
          className="adm-input"
          style={INPUT}
          value={typeof valor === "string" ? valor : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          aria-invalid={erro || undefined}
        >
          <option value="">Selecione</option>
          {campo.opcoes?.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (campo.tipo === "enum" || campo.tipo === "multi") {
    const multi = campo.tipo === "multi";
    const selecionados = multi ? (Array.isArray(valor) ? valor : []) : [];
    const limite = campo.maxSelecoes;
    return (
      <fieldset style={estiloGrupo} aria-invalid={erro || undefined}>
        {legenda}
        {multi && limite && (
          <p style={{ fontSize: "13px", color: "var(--cor-muted)", margin: "0 0 6px" }}>Marque até {limite}.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {campo.opcoes?.map((o) => {
            const marcado = multi ? selecionados.includes(o.valor) : valor === o.valor;
            const bloqueado = multi && !marcado && !!limite && selecionados.length >= limite;
            return (
              <label
                key={o.valor}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  minHeight: "44px",
                  border: `1px solid ${marcado ? "var(--cor-action-blue)" : "var(--cor-border-light)"}`,
                  borderRadius: "var(--radius-sm)",
                  background: marcado ? "var(--cor-pale-blue)" : "var(--cor-canvas)",
                  opacity: bloqueado ? 0.5 : 1,
                  cursor: bloqueado ? "not-allowed" : "pointer",
                  fontSize: "14px",
                }}
              >
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={id}
                  checked={marcado}
                  disabled={bloqueado}
                  onChange={() => {
                    if (!multi) return onChange(o.valor);
                    onChange(marcado ? selecionados.filter((x) => x !== o.valor) : [...selecionados, o.valor]);
                  }}
                />
                {o.rotulo}
              </label>
            );
          })}
        </div>
        {ajuda}
      </fieldset>
    );
  }

  if (campo.tipo === "texto") {
    const texto = typeof valor === "string" ? valor : "";
    const max = campo.maxChars ?? 280;
    const longo = max > 140;
    const props = {
      id,
      className: "adm-input",
      style: { ...INPUT, fontSize: "15px" },
      value: texto,
      maxLength: max,
      placeholder: campo.placeholder,
      spellCheck: false,
      autoCorrect: "off",
      autoCapitalize: "off",
      "aria-invalid": erro || undefined,
      "aria-describedby": `${id}-contador`,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value || undefined),
    };
    return (
      <div className="adm-campo">
        <label htmlFor={id} style={{ fontSize: "15px", fontWeight: 600 }}>
          {campo.rotulo}
          {!campo.obrigatorio && <span style={{ fontWeight: 400, color: "var(--cor-muted)" }}> (opcional)</span>}
        </label>
        {longo ? <textarea rows={4} {...props} /> : <input type="text" {...props} />}
        <span id={`${id}-contador`} style={{ ...NUMEROS, fontSize: "12px", color: "var(--cor-muted)", textAlign: "right" }}>
          {texto.length}/{max}
          {campo.minChars ? ` · mínimo ${campo.minChars}` : ""}
        </span>
        {ajuda}
      </div>
    );
  }

  if (campo.tipo === "inteiro") {
    return (
      <div className="adm-campo">
        <label htmlFor={id} style={{ fontSize: "15px", fontWeight: 600 }}>
          {campo.rotulo}
        </label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          className="adm-input"
          style={{ ...INPUT, ...NUMEROS, maxWidth: "140px" }}
          value={typeof valor === "number" ? String(valor) : ""}
          aria-invalid={erro || undefined}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "");
            if (!d) return onChange(undefined);
            const n = Math.min(Number(d), campo.max ?? Number.MAX_SAFE_INTEGER);
            onChange(n);
          }}
        />
        {ajuda}
      </div>
    );
  }

  // centavos
  return (
    <div className="adm-campo">
      <label htmlFor={id} style={{ fontSize: "15px", fontWeight: 600 }}>
        {campo.rotulo}
        {!campo.obrigatorio && <span style={{ fontWeight: 400, color: "var(--cor-muted)" }}> (opcional)</span>}
      </label>
      <InputReais id={id} valor={typeof valor === "number" ? valor : null} onChange={(c) => onChange(c ?? undefined)} erro={erro} />
      {ajuda}
    </div>
  );
}

export function InputReais({
  id,
  valor,
  onChange,
  erro,
  rotuloAcessivel,
}: {
  id: string;
  valor: number | null;
  onChange: (centavos: number | null) => void;
  erro?: boolean;
  rotuloAcessivel?: string;
}) {
  const [texto, setTexto] = useState(valor === null ? "" : formatarCentavosEditavel(valor));
  const [focado, setFocado] = useState(false);
  useEffect(() => {
    if (!focado) setTexto(valor === null ? "" : formatarCentavosEditavel(valor));
  }, [valor, focado]);

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className="adm-input"
      style={{ ...INPUT, ...NUMEROS }}
      placeholder="R$ 0"
      value={texto}
      aria-label={rotuloAcessivel}
      aria-invalid={erro || undefined}
      onFocus={() => setFocado(true)}
      onBlur={() => {
        setFocado(false);
        setTexto(valor === null ? "" : formatarCentavosEditavel(valor));
      }}
      onChange={(e) => {
        const bruto = e.target.value.replace(/[^\d,]/g, "");
        setTexto(bruto);
        onChange(parseCentavos(bruto));
      }}
    />
  );
}

/** Exibe com centavos só quando houver fração. */
function formatarCentavosEditavel(c: number): string {
  if (c % 100 === 0) return formatarCentavos(c);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100).replace(/ /g, " ");
}

function GradeMeses({
  payload,
  onChange,
  mesesReferencia,
  campoComErro,
}: {
  payload: PayloadDiagnostico;
  onChange: (chave: string, valor: ValorCampo) => void;
  mesesReferencia: string[];
  campoComErro?: string | null;
}) {
  const naoSei = payload.placar_nao_sei === true;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
      {mesesReferencia.map((ref, i) => {
        const n = i + 1;
        const chaveFonte = chaveMes(n, "fonte");
        const erroMes = campoComErro === chaveFonte || campoComErro === "mes_*";
        return (
          <fieldset
            key={ref}
            className="card"
            style={{
              margin: 0,
              minWidth: 0,
              padding: "var(--espaco-md)",
              border: `1px solid ${erroMes ? "var(--cor-error)" : "var(--cor-border-light)"}`,
            }}
          >
            <legend style={{ fontWeight: 700, fontSize: "15px", padding: "0 4px", textTransform: "capitalize" }}>
              {formatarMesCurto(ref)}
            </legend>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--espaco-sm)" }}>
              {PARCELAS_MES.map((parte) => {
                const chave = chaveMes(n, parte);
                const id = idDe(chave);
                const v = payload[chave];
                return (
                  <div key={parte} className="adm-campo">
                    <label htmlFor={id} style={{ fontSize: "13px", fontWeight: 600 }}>
                      {ROTULOS_PARCELA[parte]}
                    </label>
                    <InputReais
                      id={id}
                      valor={typeof v === "number" ? v : null}
                      onChange={(c) => onChange(chave, c ?? undefined)}
                    />
                  </div>
                );
              })}
              <div className="adm-campo">
                <label htmlFor={idDe(chaveFonte)} style={{ fontSize: "13px", fontWeight: 600 }}>
                  De onde tirou o número
                </label>
                <select
                  id={idDe(chaveFonte)}
                  className="adm-input"
                  style={INPUT}
                  value={typeof payload[chaveFonte] === "string" ? (payload[chaveFonte] as string) : ""}
                  aria-invalid={campoComErro === chaveFonte || undefined}
                  onChange={(e) => onChange(chaveFonte, e.target.value || undefined)}
                >
                  <option value="">Selecione</option>
                  {FONTES_MES.map((f) => (
                    <option key={f} value={f}>
                      {ROTULOS_FONTE[f]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>
        );
      })}
      <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px", minHeight: "44px" }}>
        <input
          type="checkbox"
          checked={naoSei}
          onChange={(e) => onChange("placar_nao_sei", e.target.checked ? true : undefined)}
          style={{ marginTop: "3px" }}
        />
        <span>
          Não sei o meu placar. <span style={{ color: "var(--cor-muted)" }}>Marque só se não consegue preencher pelo menos 3 meses.</span>
        </span>
      </label>
    </div>
  );
}
