"use client";

import React, { useState } from "react";
import { ComprovanteItem, DeclaracaoFaturamento, validarComprovanteFaturamento } from "@/lib/api/faturamento";
import { UploadArquivos, ArquivoUploadItem } from "../ui/UploadArquivos";

interface FormularioFaturamentoProps {
  onSalvar: (declaracao: DeclaracaoFaturamento) => void;
}

export function FormularioFaturamento({ onSalvar }: FormularioFaturamentoProps) {
  const [mesReferencia, setMesReferencia] = useState("2026-09-01");
  const [valorTexto, setValorTexto] = useState("");
  const [comprovantes, setComprovantes] = useState<ComprovanteItem[]>([]);
  const [erro, setErro] = useState("");

  const comprovantesUpload: ArquivoUploadItem[] = comprovantes.map((c, i) => ({
    id: `comprovante-${i}-${c.nome}`,
    nome: c.nome,
    tamanhoBytes: 1024 * 350,
    status: "concluido",
  }));

  const handleUploadChange = (novos: ArquivoUploadItem[]) => {
    if (novos.length < comprovantes.length) {
      const idxRemovido = comprovantes.findIndex((c) => !novos.some((n) => n.nome === c.nome));
      if (idxRemovido !== -1) {
        setComprovantes(comprovantes.filter((_, i) => i !== idxRemovido));
      }
    } else {
      const novosAdicionados = novos.slice(comprovantes.length);
      const novosComprovantes: ComprovanteItem[] = [];

      for (const item of novosAdicionados) {
        const validacao = validarComprovanteFaturamento(item.nome);
        if (!validacao.valido) {
          setErro(validacao.motivo || "Arquivo com formato inválido");
          return;
        }

        const isZip = item.nome.toLowerCase().endsWith(".zip");
        novosComprovantes.push({
          nome: item.nome,
          path: `faturamentos/${Date.now()}_${item.nome}`,
          tipo: isZip ? "zip" : "arquivo",
        });
      }

      setErro("");
      setComprovantes([...comprovantes, ...novosComprovantes]);
    }
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

        {/* Upload de Comprovantes ou ZIP (Norma de UX ÁGUIAS ONE) */}
        <UploadArquivos
          rotulo="Comprovantes de Faturamento"
          descricao="Anexe extratos, comprovantes fiscais (PDF/Imagens) ou um pacote único compactado (.ZIP)"
          arquivos={comprovantesUpload}
          onChange={handleUploadChange}
          formatosPermitidos={[".zip", ".pdf", ".png", ".jpg", ".jpeg"]}
          tamanhoMaximoBytes={25 * 1024 * 1024}
          maximoArquivos={5}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--espaco-sm)" }}>
          <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
            Salvar Declaração Mensal
          </button>
        </div>
      </form>
    </div>
  );
}
