"use client";

import React, { useState } from "react";
import { InputLinkEvidencia } from "./InputLinkEvidencia";
import { InputMultiploArquivos } from "./InputMultiploArquivos";
import { IconCheckCircle } from "../ui/Icons";
import {
  SubmissaoCheckin,
  EvidenciaLinkItem,
  EvidenciaArquivoItem,
  validarSubmissaoCheckin,
} from "@/lib/api/checkin";

interface FormularioCheckinModularProps {
  moduloId: string;
  moduloTitulo: string;
  itensRoteiro?: string[];
  submissaoExistente?: SubmissaoCheckin | null;
  onEnviar: (submissao: SubmissaoCheckin) => void;
}

export function FormularioCheckinModular({
  moduloId,
  moduloTitulo,
  itensRoteiro = [],
  submissaoExistente,
  onEnviar,
}: FormularioCheckinModularProps) {
  const [links, setLinks] = useState<EvidenciaLinkItem[]>(
    submissaoExistente?.links || [{ rotulo: "Link do Site / Evidência", url: "" }]
  );
  const [arquivos, setArquivos] = useState<EvidenciaArquivoItem[]>(
    submissaoExistente?.arquivos || []
  );
  const [travou, setTravou] = useState(submissaoExistente?.travou || "");
  const [duvidaCall, setDuvidaCall] = useState(submissaoExistente?.duvidaCall || "");
  const [erros, setErros] = useState<string[]>([]);
  const [enviadoComSucesso, setEnviadoComSucesso] = useState(false);

  const handleUpdateLink = (index: number, novaUrl: string) => {
    const copia = [...links];
    copia[index].url = novaUrl;
    setLinks(copia);
  };

  const handleAdicionarArquivo = (novo: EvidenciaArquivoItem) => {
    setArquivos([...arquivos, novo]);
  };

  const handleRemoverArquivo = (index: number) => {
    setArquivos(arquivos.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dados: SubmissaoCheckin = {
      id: submissaoExistente?.id,
      matriculaId: "matricula-atual",
      moduloId,
      links,
      arquivos,
      travou: travou.trim(),
      duvidaCall: duvidaCall.trim(),
      status: "aguardando_avaliacao",
      enviadoEm: new Date().toISOString(),
    };

    const validacao = validarSubmissaoCheckin(dados);
    if (!validacao.valido) {
      setErros(validacao.erros);
      return;
    }

    setErros([]);
    onEnviar(dados);
    setEnviadoComSucesso(true);
  };

  if (enviadoComSucesso) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "var(--espaco-xxl)" }}>
        <IconCheckCircle size={40} style={{ color: "var(--cor-deep-green)", margin: "0 auto var(--espaco-sm) auto" }} />
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "var(--espaco-xs)" }}>Entrega Submetida</h2>
        <p style={{ color: "var(--cor-muted)", fontSize: "14px", marginBottom: "var(--espaco-lg)" }}>
          O Anjo (Ana Carolina) e o Concierge (Flávio) já receberam seus links e arquivos para auditoria.
        </p>
        <a href="/dashboard" className="btn-primary">
          Voltar ao Dashboard
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ marginTop: "var(--espaco-lg)" }}>
      <div style={{ marginBottom: "var(--espaco-lg)", borderBottom: "1px solid var(--cor-border-light)", paddingBottom: "var(--espaco-md)" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "var(--espaco-xs)" }}>{moduloTitulo}</h2>
        <p style={{ color: "var(--cor-muted)", fontSize: "14px" }}>
          Preencha os campos abaixo com as evidências de comprovação prática da aula.
        </p>
      </div>

      {/* Roteiro da Aula */}
      {itensRoteiro.length > 0 && (
        <div style={{
          backgroundColor: "#f9fafb",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
          marginBottom: "var(--espaco-lg)",
        }}>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--cor-primary)", marginBottom: "6px" }}>
            CHECKLIST DE ENTREGA DESTA DISCIPLINA:
          </h4>
          <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--cor-body-muted)" }}>
            {itensRoteiro.map((item, idx) => (
              <li key={idx} style={{ marginBottom: "2px" }}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {erros.length > 0 && (
        <div style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "var(--cor-error)",
          padding: "var(--espaco-md)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "var(--espaco-lg)",
          fontSize: "13px",
        }}>
          <strong>Atenção às pendências para envio:</strong>
          <ul style={{ paddingLeft: "20px", marginTop: "4px" }}>
            {erros.map((erro, idx) => (
              <li key={idx}>{erro}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Links de Evidência */}
      <h3 style={{ fontSize: "16px", marginBottom: "var(--espaco-sm)" }}>1. Links de Comprovação</h3>
      {links.map((link, idx) => (
        <InputLinkEvidencia
          key={idx}
          rotulo={link.rotulo}
          url={link.url}
          onChange={(novaUrl) => handleUpdateLink(idx, novaUrl)}
        />
      ))}

      {/* 2. Múltiplos Uploads de Arquivos e Prints */}
      <h3 style={{ fontSize: "16px", marginTop: "var(--espaco-lg)", marginBottom: "var(--espaco-sm)" }}>
        2. Prints e Arquivos de Comprovação
      </h3>
      <InputMultiploArquivos
        rotulo="Anexar Prints das Pastas / E-mail / Telas"
        arquivos={arquivos}
        onAdicionar={handleAdicionarArquivo}
        onRemover={handleRemoverArquivo}
      />

      {/* 3. Travas e Dúvidas */}
      <h3 style={{ fontSize: "16px", marginTop: "var(--espaco-lg)", marginBottom: "var(--espaco-sm)" }}>
        3. Acompanhamento & Travas (Opcional)
      </h3>
      <div style={{ marginBottom: "var(--espaco-md)" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
          Travou em alguma etapa técnica deste módulo? (1 linha objetiva)
        </label>
        <input
          type="text"
          value={travou}
          onChange={(e) => setTravou(e.target.value)}
          placeholder="Ex: Dúvida na propagação do DNS no Hostinger..."
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "var(--radius-xs)",
            border: "1px solid var(--cor-border-light)",
            fontSize: "14px",
          }}
        />
      </div>

      <div style={{ marginBottom: "var(--espaco-xl)" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
          Dúvida específica para a call de quarta-feira com o Flávio (Botão na Tela):
        </label>
        <input
          type="text"
          value={duvidaCall}
          onChange={(e) => setDuvidaCall(e.target.value)}
          placeholder="Ex: Como lidar com advogado que pede laudo sem assinar contrato?"
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "var(--radius-xs)",
            border: "1px solid var(--cor-border-light)",
            fontSize: "14px",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--espaco-md)" }}>
        <button type="button" className="btn-secondary" onClick={() => history.back()}>
          Cancelar / Voltar
        </button>
        <button type="submit" className="btn-primary" style={{ padding: "12px 28px" }}>
          Submeter Entrega do Módulo →
        </button>
      </div>
    </form>
  );
}
