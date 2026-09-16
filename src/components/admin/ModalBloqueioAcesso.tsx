"use client";

import React, { useState } from "react";
import { AlunoCadastro } from "@/lib/api/alunos";
import {
  BloqueioAcesso,
  DadosNovoBloqueio,
  MotivoBloqueio,
  ROTULOS_MOTIVO_BLOQUEIO,
  bloqueioEstaVigente,
  formatarDataBloqueio,
  validarNovoBloqueio,
} from "@/lib/api/bloqueio-acesso";

interface ModalBloqueioAcessoProps {
  aberto: boolean;
  aluno: AlunoCadastro;
  bloqueioAtual?: BloqueioAcesso;
  historico: BloqueioAcesso[];
  onBloquear: (dados: DadosNovoBloqueio) => void;
  onDesbloquear: (alunoId: string, observacao?: string) => void;
  onFechar: () => void;
}

const CAMPO: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "var(--radius-xs)",
  border: "1px solid var(--cor-border-light)",
  backgroundColor: "var(--cor-canvas)",
};
const ROTULO: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" };

export function ModalBloqueioAcesso({ aberto, aluno, bloqueioAtual, historico, onBloquear, onDesbloquear, onFechar }: ModalBloqueioAcessoProps) {
  const vigente = bloqueioEstaVigente(bloqueioAtual);
  const [motivo, setMotivo] = useState<MotivoBloqueio>("inadimplencia");
  const [mensagemAoAluno, setMensagemAoAluno] = useState("");
  const [observacaoInterna, setObservacaoInterna] = useState("");
  const [liberarEm, setLiberarEm] = useState("");
  const [observacaoDesbloqueio, setObservacaoDesbloqueio] = useState("");
  const [erros, setErros] = useState<string[]>([]);

  if (!aberto || !aluno.id) return null;
  const alunoId = aluno.id;

  const handleBloquear = (e: React.FormEvent) => {
    e.preventDefault();
    const dados: DadosNovoBloqueio = { alunoId, motivo, mensagemAoAluno, observacaoInterna, liberarEm: liberarEm || undefined };
    const validacao = validarNovoBloqueio(dados);
    if (!validacao.valido) {
      setErros(validacao.erros);
      return;
    }
    onBloquear(dados);
    onFechar();
  };

  const handleDesbloquear = (e: React.FormEvent) => {
    e.preventDefault();
    onDesbloquear(alunoId, observacaoDesbloqueio);
    onFechar();
  };

  const borda = (campo: string): React.CSSProperties => (erros.includes(campo) ? { border: "1px solid var(--cor-error)" } : {});
  const historicoDoAluno = historico.filter((b) => b.alunoId === alunoId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-bloqueio-titulo"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", backgroundColor: "var(--cor-canvas)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--espaco-md)" }}>
          <div>
            <h3 id="modal-bloqueio-titulo">{vigente ? "Desbloquear acesso" : "Bloquear acesso ao sistema"}</h3>
            <p style={{ fontSize: "13px", color: "var(--cor-muted)" }}>{aluno.nome} · {aluno.email}</p>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" style={{ fontSize: "18px", color: "var(--cor-muted)", background: "transparent", border: "none", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {vigente && bloqueioAtual ? (
          <form onSubmit={handleDesbloquear} style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--radius-sm)", padding: "12px", fontSize: "13px" }}>
              <div style={{ fontWeight: 600, color: "#991b1b", marginBottom: "4px" }}>Acesso bloqueado desde {formatarDataBloqueio(bloqueioAtual.bloqueadoEm)}</div>
              <div>Motivo: {ROTULOS_MOTIVO_BLOQUEIO[bloqueioAtual.motivo]}</div>
              <div>Por: {bloqueioAtual.bloqueadoPor}</div>
              {bloqueioAtual.liberarEm && <div>Liberação automática: {formatarDataBloqueio(bloqueioAtual.liberarEm)}</div>}
              {bloqueioAtual.mensagemAoAluno && <div>Mensagem ao aluno: {bloqueioAtual.mensagemAoAluno}</div>}
              {bloqueioAtual.observacaoInterna && <div>Observação interna: {bloqueioAtual.observacaoInterna}</div>}
            </div>
            <div>
              <label htmlFor="blq-obs-desbloqueio" style={ROTULO}>Observação do desbloqueio (opcional)</label>
              <textarea id="blq-obs-desbloqueio" rows={2} value={observacaoDesbloqueio} onChange={(e) => setObservacaoDesbloqueio(e.target.value)} placeholder="Ex: pagamento regularizado em 16/09" style={CAMPO} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--espaco-sm)" }}>
              <button type="button" className="btn-secondary" onClick={onFechar}>Cancelar</button>
              <button type="submit" className="btn-primary">Desbloquear acesso</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBloquear} style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
            {erros.length > 0 && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "var(--cor-error)", padding: "var(--espaco-sm) var(--espaco-md)", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
                Confira os campos destacados. Para "Outro motivo" a observação interna é obrigatória e a data de liberação precisa ser futura.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--espaco-md)" }}>
              <div>
                <label htmlFor="blq-motivo" style={ROTULO}>Motivo *</label>
                <select id="blq-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoBloqueio)} style={{ ...CAMPO, ...borda("motivo") }}>
                  {(Object.keys(ROTULOS_MOTIVO_BLOQUEIO) as MotivoBloqueio[]).map((m) => (
                    <option key={m} value={m}>{ROTULOS_MOTIVO_BLOQUEIO[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="blq-liberar" style={ROTULO}>Liberar automaticamente em</label>
                <input id="blq-liberar" type="date" value={liberarEm} onChange={(e) => setLiberarEm(e.target.value)} style={{ ...CAMPO, ...borda("liberarEm") }} />
              </div>
            </div>
            <div>
              <label htmlFor="blq-mensagem" style={ROTULO}>Mensagem exibida ao aluno</label>
              <textarea id="blq-mensagem" rows={2} value={mensagemAoAluno} onChange={(e) => setMensagemAoAluno(e.target.value)} placeholder="Ex: Identificamos uma pendência financeira. Fale com a coordenação para regularizar." style={CAMPO} />
            </div>
            <div>
              <label htmlFor="blq-obs" style={ROTULO}>Observação interna (só a equipe vê){motivo === "outro" ? " *" : ""}</label>
              <textarea id="blq-obs" rows={2} value={observacaoInterna} onChange={(e) => setObservacaoInterna(e.target.value)} style={{ ...CAMPO, ...borda("observacaoInterna") }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--espaco-sm)" }}>
              <button type="button" className="btn-secondary" onClick={onFechar}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ background: "var(--cor-error)" }}>Bloquear acesso</button>
            </div>
          </form>
        )}

        {historicoDoAluno.length > 0 && (
          <div style={{ marginTop: "var(--espaco-lg)", borderTop: "1px solid var(--cor-border-light)", paddingTop: "var(--espaco-md)" }}>
            <h4 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Histórico de bloqueios</h4>
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px", color: "var(--cor-text-muted)" }}>
              {historicoDoAluno.map((b) => (
                <li key={b.id}>
                  {formatarDataBloqueio(b.bloqueadoEm)} · {ROTULOS_MOTIVO_BLOQUEIO[b.motivo]} · por {b.bloqueadoPor}
                  {b.desbloqueadoEm ? ` · desbloqueado em ${formatarDataBloqueio(b.desbloqueadoEm)} por ${b.desbloqueadoPor}` : b.liberarEm ? ` · liberação prevista ${formatarDataBloqueio(b.liberarEm)}` : " · vigente"}
                  {b.observacaoDesbloqueio && ` · ${b.observacaoDesbloqueio}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
