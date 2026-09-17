"use client";

import React, { useState } from "react";
import {
  ComprovanteItem,
  DeclaracaoFaturamento,
  formatarMesReferencia,
  mesReferenciaAtual,
  ultimosMesesReferencia,
} from "@/lib/api/faturamento";
import { REGRAS_BUCKET, extensoesDoBucket } from "@/lib/arquivos/regras";
import { UploadArquivos } from "../ui/UploadArquivos";
import { useEnvioArquivos } from "../ui/useEnvioArquivos";

interface FormularioFaturamentoProps {
  /** Resolve depois que o servidor responde; o formulário só limpa se a declaração foi gravada. */
  onSalvar: (declaracao: DeclaracaoFaturamento) => Promise<{ sucesso: boolean; erro?: string }>;
}

export function FormularioFaturamento({ onSalvar }: FormularioFaturamentoProps) {
  const [mesReferencia, setMesReferencia] = useState(() => mesReferenciaAtual());
  const [valorTexto, setValorTexto] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const envio = useEnvioArquivos("comprovantes");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    const cleanNumber = valorTexto.replace(/\D/g, "");
    if (!cleanNumber || Number(cleanNumber) <= 0) {
      setErro("Informe um valor bruto válido maior que zero.");
      return;
    }
    if (envio.enviando) {
      setErro("Aguarde o envio do comprovante terminar.");
      return;
    }
    if (envio.comErro) {
      setErro("Remova ou reenvie o comprovante com erro antes de salvar.");
      return;
    }

    const comprovantes: ComprovanteItem[] = envio.concluidos.map((arq) => ({
      nome: arq.nome,
      path: arq.storagePath,
      tipo: arq.nome.toLowerCase().endsWith(".zip") ? "zip" : "arquivo",
    }));

    const declaracao: DeclaracaoFaturamento = {
      matriculaId: "mat-atual",
      mesReferencia,
      valorBruto: Number(cleanNumber) / 100,
      comprovantes,
      criadoEm: new Date().toISOString(),
    };

    setErro("");
    setSalvando(true);
    const resultado = await onSalvar(declaracao);
    setSalvando(false);
    if (!resultado.sucesso) {
      setErro(resultado.erro || "Não foi possível salvar a declaração. Tente novamente.");
      return;
    }
    setValorTexto("");
    envio.limpar();
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
        Declare o valor bruto recebido e anexe o comprovante: um PDF, uma foto ou, se forem vários documentos, um único arquivo <strong>.zip</strong>.
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
              {ultimosMesesReferencia(12).map((mes) => (
                <option key={mes} value={mes}>
                  {formatarMesReferencia(mes).replace(" de ", " / ")}
                </option>
              ))}
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
          descricao="Extrato ou comprovante fiscal (PDF/imagem). Vários documentos? Compacte em um único .ZIP"
          arquivos={envio.itens}
          onChange={envio.onChange}
          onTentarNovamente={envio.tentarNovamente}
          formatosPermitidos={extensoesDoBucket("comprovantes")}
          tamanhoMaximoBytes={REGRAS_BUCKET.comprovantes.tamanhoMaximoBytes}
          maximoArquivos={1}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--espaco-sm)" }}>
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: "10px 24px" }}
            disabled={salvando || envio.enviando}
            aria-busy={salvando}
          >
            {salvando ? "Salvando…" : envio.enviando ? "Aguardando comprovante…" : "Salvar Declaração Mensal"}
          </button>
        </div>
      </form>
    </div>
  );
}
