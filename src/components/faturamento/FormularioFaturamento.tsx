"use client";

import React, { useState, useRef } from "react";
import { ComprovanteItem, DeclaracaoFaturamento, validarComprovanteFaturamento } from "@/lib/api/faturamento";
import { IconFolder } from "../ui/Icons";

interface FormularioFaturamentoProps {
  onSalvar: (declaracao: DeclaracaoFaturamento) => void;
}

export function FormularioFaturamento({ onSalvar }: FormularioFaturamentoProps) {
  const [mesReferencia, setMesReferencia] = useState("2026-09-01");
  const [valorTexto, setValorTexto] = useState("");
  const [comprovantes, setComprovantes] = useState<ComprovanteItem[]>([]);
  const [erro, setErro] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const novos: ComprovanteItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validacao = validarComprovanteFaturamento(file.name);
      if (!validacao.valido) {
        setErro(validacao.motivo || "Arquivo com formato inválido");
        return;
      }

      const isZip = file.name.toLowerCase().endsWith(".zip");
      novos.push({
        nome: file.name,
        path: `faturamentos/${Date.now()}_${file.name}`,
        tipo: isZip ? "zip" : "arquivo",
      });
    }

    setErro("");
    setComprovantes([...comprovantes, ...novos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoverComprovante = (idx: number) => {
    setComprovantes(comprovantes.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = valorTexto.replace(/\D/g, "");
    if (!cleanNumber || Number(cleanNumber) <= 0) {
      setErro("Informe um valor bruto válido maior que zero.");
      return;
    }

    const valorBruto = Number(cleanNumber) / 100;

    const declaracao: DeclaracaoFaturamento = {
      matriculaId: "mat-atual",
      mesReferencia,
      valorBruto,
      comprovantes,
      criadoEm: new Date().toISOString(),
    };

    onSalvar(declaracao);
    setValorTexto("");
    setComprovantes([]);
    setErro("");
  };

  const formatarInputValor = (digitado: string) => {
    const apenasDigitos = digitado.replace(/\D/g, "");
    if (!apenasDigitos) {
      setValorTexto("");
      return;
    }
    const centavos = (Number(apenasDigitos) / 100).toFixed(2);
    const partes = centavos.split(".");
    const inteiros = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setValorTexto(`R$ ${inteiros},${partes[1]}`);
  };

  return (
    <div className="card" style={{ marginBottom: "var(--espaco-xl)" }}>
      <h3 style={{ fontSize: "18px", marginBottom: "var(--espaco-xs)" }}>Declarar Faturamento do Mês</h3>
      <p style={{ color: "var(--cor-muted)", fontSize: "13px", marginBottom: "var(--espaco-lg)" }}>
        Declare o valor bruto recebido e anexe os comprovantes em arquivos avulsos (PDF/fotos) ou em um arquivo <strong>.zip</strong> único.
      </p>

      {erro && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "var(--cor-error)",
          padding: "10px 14px",
          borderRadius: "var(--radius-xs)",
          marginBottom: "var(--espaco-md)",
          fontSize: "13px",
        }}>
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "var(--espaco-md)" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>
              Mês de Referência *
            </label>
            <select
              value={mesReferencia}
              onChange={(e) => setMesReferencia(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--cor-border-light)",
                backgroundColor: "var(--cor-canvas)",
                fontSize: "14px",
              }}
            >
              <option value="2026-09-01">Setembro / 2026</option>
              <option value="2026-08-01">Agosto / 2026</option>
              <option value="2026-07-01">Julho / 2026</option>
              <option value="2026-06-01">Junho / 2026</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>
              Valor Bruto Recebido (R$) *
            </label>
            <input
              type="text"
              value={valorTexto}
              onChange={(e) => formatarInputValor(e.target.value)}
              placeholder="R$ 0,00"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--cor-border-light)",
                fontSize: "15px",
                fontWeight: 600,
              }}
            />
          </div>
        </div>

        {/* Upload de Comprovantes ou ZIP */}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>
            Comprovantes (PDFs, Imagens ou Pacote .ZIP compactado)
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed var(--cor-hairline)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--espaco-md)",
              textAlign: "center",
              backgroundColor: "#fafafb",
              cursor: "pointer",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".zip,application/pdf,image/png,image/jpeg"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px", color: "var(--cor-slate)" }}>
              <IconFolder size={20} />
            </div>
            <div style={{ fontSize: "13px", fontWeight: 500, marginTop: "2px" }}>
              Clique para anexar comprovantes ou arquivo .zip
            </div>
          </div>

          {comprovantes.length > 0 && (
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {comprovantes.map((c, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#f9fafb",
                  border: "1px solid var(--cor-border-light)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-xs)",
                  fontSize: "13px",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      backgroundColor: "var(--cor-soft-stone)",
                      padding: "1px 5px",
                      borderRadius: "2px",
                      fontFamily: "var(--font-family-mono)",
                    }}>
                      {c.tipo.toUpperCase()}
                    </span>
                    <span>{c.nome}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoverComprovante(i)}
                    style={{ color: "var(--cor-error)", fontSize: "12px" }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--espaco-sm)" }}>
          <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
            Salvar Declaração Mensal
          </button>
        </div>
      </form>
    </div>
  );
}
