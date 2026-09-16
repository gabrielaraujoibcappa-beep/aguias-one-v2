"use client";

import React from "react";
import Link from "next/link";
import { FichaAluno as FichaAlunoDados, NivelAlerta, ROTULOS_STATUS_MATRICULA } from "@/lib/api/ficha-aluno";
import { formatarMesReferencia, formatarMoedaReal } from "@/lib/api/faturamento";
import { ROTULOS_MOTIVO_BLOQUEIO, formatarDataBloqueio } from "@/lib/api/bloqueio-acesso";
import { StatusDot, StatusVariant } from "../ui/StatusDot";
import { BadgeStatusAuditoria } from "../faturamento/BadgeStatusAuditoria";

interface FichaAlunoProps {
  ficha: FichaAlunoDados;
  contexto?: { rotulo: string; retornoHref: string; retornoRotulo: string };
}

const NAO_INFORMADO = "Não informado";

const COR_ALERTA: Record<NivelAlerta, { fundo: string; borda: string; texto: string; dot: StatusVariant; rotulo: string }> = {
  critico: { fundo: "#fef2f2", borda: "#fecaca", texto: "#991b1b", dot: "vermelho", rotulo: "Crítico" },
  atencao: { fundo: "#fffbeb", borda: "#fde68a", texto: "#92400e", dot: "amarelo", rotulo: "Atenção" },
  info: { fundo: "#eff6ff", borda: "#bfdbfe", texto: "#1e40af", dot: "azul", rotulo: "Informativo" },
};

const ROTULO_ENTREGA: Record<string, string> = {
  aguardando_avaliacao: "Aguardando avaliação",
  ajuste_solicitado: "Ajuste solicitado",
  aprovado: "Aprovado",
};

const VARIANTE_ENTREGA: Record<string, StatusVariant> = {
  aguardando_avaliacao: "amarelo",
  ajuste_solicitado: "vermelho",
  aprovado: "verde",
};

function dataCurta(iso?: string): string {
  return iso ? new Date(iso).toLocaleDateString("pt-BR") : NAO_INFORMADO;
}

function Secao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="card" aria-labelledby={id} style={{ marginBottom: "var(--espaco-lg)" }}>
      <h2 id={id} style={{ fontSize: "16px", fontWeight: 600, marginBottom: "var(--espaco-md)" }}>{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({ rotulo, valor, mono = false }: { rotulo: string; valor?: React.ReactNode; mono?: boolean }) {
  const vazio = valor === undefined || valor === null || valor === "";
  return (
    <div>
      <dt style={{ fontSize: "12px", color: "var(--cor-text-muted)", marginBottom: "2px" }}>{rotulo}</dt>
      <dd style={{ fontSize: "14px", color: vazio ? "var(--cor-muted)" : "var(--cor-ink)", fontStyle: vazio ? "italic" : "normal", fontVariantNumeric: mono ? "tabular-nums" : undefined }}>
        {vazio ? NAO_INFORMADO : valor}
      </dd>
    </div>
  );
}

const GRADE: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--espaco-md)", margin: 0 };
const TABELA: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" };
const TH: React.CSSProperties = { padding: "8px", color: "var(--cor-muted)", borderBottom: "1px solid var(--cor-hairline)", fontWeight: 500 };
const TD: React.CSSProperties = { padding: "10px 8px", borderBottom: "1px solid var(--cor-border-light)", verticalAlign: "top" };

export function FichaAluno({ ficha, contexto }: FichaAlunoProps) {
  const { aluno, dadosPessoais, academico, administrativo, canais, alertas } = ficha;
  const s = academico.semaforo;
  const whatsappDigitos = dadosPessoais.whatsapp.replace(/\D/g, "");

  return (
    <div>
      {/* Cabeçalho com contexto operacional */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--espaco-md)", marginBottom: "var(--espaco-lg)" }}>
        <div>
          {contexto && (
            <Link href={contexto.retornoHref} style={{ fontSize: "13px", color: "var(--cor-muted)", textDecoration: "none", display: "inline-block", marginBottom: "6px" }}>
              ← {contexto.retornoRotulo}
            </Link>
          )}
          <h1 style={{ fontSize: "26px", marginBottom: "4px" }}>{dadosPessoais.nome}</h1>
          <p style={{ color: "var(--cor-muted)", fontSize: "14px" }}>
            Ficha completa do mentorado · {academico.turmaNome ?? "Turma não informada"}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          {contexto && (
            <span style={{ backgroundColor: "var(--cor-soft-stone)", border: "1px solid var(--cor-border-light)", padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: "12px", fontWeight: 600 }}>
              Operação: {contexto.rotulo}
            </span>
          )}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {whatsappDigitos && (
              <a href={`https://wa.me/${whatsappDigitos.startsWith("55") ? whatsappDigitos : `55${whatsappDigitos}`}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)" }}>
                WhatsApp
              </a>
            )}
            <a href={`mailto:${dadosPessoais.email}`} className="btn-secondary" style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)" }}>
              E-mail
            </a>
            <Link href="/admin/alunos" className="btn-secondary" style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)" }}>
              Editar cadastro
            </Link>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <Secao id="ficha-alertas" titulo={alertas.length === 0 ? "Sem pontos de atenção" : `Pontos de atenção (${alertas.length})`}>
        {alertas.length === 0 ? (
          <p style={{ fontSize: "14px", color: "var(--cor-muted)" }}>Nada exige ação para este aluno no momento.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            {alertas.map((a, i) => {
              const cor = COR_ALERTA[a.nivel];
              return (
                <li key={i} style={{ backgroundColor: cor.fundo, border: `1px solid ${cor.borda}`, borderRadius: "var(--radius-sm)", padding: "10px 12px", display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <StatusDot status={cor.dot} size={7} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: cor.texto }}>
                        <span className="sr-only">{cor.rotulo}: </span>{a.titulo}
                      </div>
                      {a.detalhe && <div style={{ fontSize: "12px", color: "var(--cor-text-muted)", marginTop: "2px" }}>{a.detalhe}</div>}
                    </div>
                  </div>
                  {a.acaoHref && (
                    <Link href={a.acaoHref} style={{ fontSize: "12px", fontWeight: 500, color: cor.texto }}>
                      {a.acaoRotulo ?? "Abrir"} →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Secao>

      {/* Dados pessoais */}
      <Secao id="ficha-pessoais" titulo="Dados pessoais e contato">
        <dl style={GRADE}>
          <Campo rotulo="Nome completo" valor={dadosPessoais.nome} />
          <Campo rotulo="E-mail" valor={dadosPessoais.email} />
          <Campo rotulo="WhatsApp" valor={dadosPessoais.whatsapp} mono />
          <Campo rotulo="CPF" valor={dadosPessoais.cpf} mono />
          <Campo rotulo="Área pericial" valor={dadosPessoais.areaPericial} />
          <Campo rotulo="Identificador no sistema" valor={aluno.id} mono />
        </dl>
      </Secao>

      {/* Acadêmico */}
      <Secao id="ficha-academico" titulo="Jornada acadêmica">
        <dl style={{ ...GRADE, marginBottom: "var(--espaco-lg)" }}>
          <Campo rotulo="Turma" valor={academico.turmaNome} />
          <Campo rotulo="Código da turma" valor={academico.turma?.codigo} mono />
          <Campo rotulo="Início da turma" valor={academico.turma ? dataCurta(academico.turma.dataInicio) : undefined} />
          <Campo rotulo="Encontro semanal" valor={academico.turma?.horarioEncontro} />
          <Campo rotulo="Módulo atual" valor={s?.moduloAtual} />
          <Campo
            rotulo="Semáforo desta semana"
            valor={s ? <StatusDot status={s.semaforoAtual} label={s.semaforoAtual === "verde" ? "Regular" : s.semaforoAtual === "amarelo" ? "Atenção" : "Em risco"} size={7} /> : undefined}
          />
          <Campo
            rotulo="Histórico de semáforos (mais recente primeiro)"
            valor={s && s.historicoSemaforos.length > 0 ? (
              <span style={{ display: "inline-flex", gap: "6px" }}>
                {s.historicoSemaforos.map((h, i) => <StatusDot key={i} status={h} size={8} />)}
              </span>
            ) : undefined}
          />
          <Campo rotulo="Check-in da semana" valor={s ? (s.checkinEntregue ? "Entregue" : "Não entregue") : undefined} />
          <Campo rotulo="Trava relatada" valor={s?.travouEmLinha} />
          <Campo rotulo="Dúvida para a call de quarta" valor={s?.duvidaCall} />
        </dl>

        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
          Entregas de check-in · {academico.resumoEntregas.aprovadas} aprovada(s), {academico.resumoEntregas.aguardando} aguardando, {academico.resumoEntregas.ajustes} em ajuste
        </h3>
        {academico.entregas.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--cor-muted)", marginBottom: "var(--espaco-md)" }}>Nenhuma entrega registrada para este aluno.</p>
        ) : (
          <div style={{ overflowX: "auto", marginBottom: "var(--espaco-md)" }}>
            <table style={TABELA}>
              <thead>
                <tr><th style={TH}>Módulo</th><th style={TH}>Enviado em</th><th style={TH}>Evidências</th><th style={TH}>Situação</th><th style={TH}>Parecer</th></tr>
              </thead>
              <tbody>
                {academico.entregas.map((e) => (
                  <tr key={e.id}>
                    <td style={TD}>
                      <div style={{ fontWeight: 500 }}>{e.moduloTitulo}</div>
                      {e.travou && <div style={{ fontSize: "12px", color: "var(--cor-text-muted)" }}>Trava: {e.travou}</div>}
                      {e.duvidaCall && <div style={{ fontSize: "12px", color: "var(--cor-text-muted)" }}>Dúvida: {e.duvidaCall}</div>}
                    </td>
                    <td style={TD}>{dataCurta(e.enviadoEm)}</td>
                    <td style={TD}>
                      {e.links.length} link(s) · {e.arquivos.length} arquivo(s)
                      {e.links.map((l, i) => (
                        <div key={i}><a href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: "12px" }}>{l.rotulo}</a></div>
                      ))}
                    </td>
                    <td style={TD}><StatusDot status={VARIANTE_ENTREGA[e.status] ?? "neutro"} label={ROTULO_ENTREGA[e.status] ?? e.status} size={6} /></td>
                    <td style={{ ...TD, fontSize: "12px", color: "var(--cor-text-muted)" }}>
                      {e.parecerTexto ?? "—"}
                      {e.avaliadoPor && <div style={{ fontSize: "11px", marginTop: "2px" }}>{e.avaliadoPor} · {dataCurta(e.avaliadoEm)}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Módulos liberados na turma</h3>
        {academico.modulosLiberados.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--cor-muted)" }}>Nenhum módulo liberado.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {academico.modulosLiberados.map((m) => (
              <li key={m.id}>
                Módulo {m.numero} — {m.titulo}
                {m.liberadoEm && <span style={{ color: "var(--cor-muted)" }}> · liberado em {dataCurta(m.liberadoEm)}{m.liberadoPor ? ` por ${m.liberadoPor}` : ""}</span>}
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {/* Administrativo */}
      <Secao id="ficha-administrativo" titulo="Administrativo e faturamento">
        <dl style={{ ...GRADE, marginBottom: "var(--espaco-lg)" }}>
          <Campo
            rotulo="Situação da matrícula"
            valor={<StatusDot status={administrativo.statusMatricula === "ativo" ? "verde" : administrativo.statusMatricula === "concluido" ? "azul" : "vermelho"} label={ROTULOS_STATUS_MATRICULA[administrativo.statusMatricula]} size={6} />}
          />
          <Campo rotulo="Cadastrado em" valor={administrativo.criadoEm ? dataCurta(administrativo.criadoEm) : undefined} />
          <Campo
            rotulo="Acesso ao sistema"
            valor={
              administrativo.bloqueioAcesso ? (
                <span>
                  <StatusDot status="vermelho" label="Bloqueado" size={6} />
                  <span style={{ display: "block", fontSize: "12px", color: "var(--cor-text-muted)", marginTop: "2px" }}>
                    {ROTULOS_MOTIVO_BLOQUEIO[administrativo.bloqueioAcesso.motivo]} · desde {formatarDataBloqueio(administrativo.bloqueioAcesso.bloqueadoEm)}
                    {administrativo.bloqueioAcesso.liberarEm ? ` · libera em ${formatarDataBloqueio(administrativo.bloqueioAcesso.liberarEm)}` : ""}
                  </span>
                  {administrativo.bloqueioAcesso.observacaoInterna && (
                    <span style={{ display: "block", fontSize: "12px", color: "var(--cor-text-muted)" }}>Obs. interna: {administrativo.bloqueioAcesso.observacaoInterna}</span>
                  )}
                </span>
              ) : (
                <StatusDot status="verde" label="Liberado" size={6} />
              )
            }
          />
          <Campo
            rotulo="Histórico de bloqueios"
            valor={administrativo.historicoBloqueios.length > 0 ? `${administrativo.historicoBloqueios.length} registro(s) · último: ${ROTULOS_MOTIVO_BLOQUEIO[administrativo.historicoBloqueios[0].motivo]} em ${formatarDataBloqueio(administrativo.historicoBloqueios[0].bloqueadoEm)}` : "Nenhum bloqueio registrado"}
          />
          <Campo rotulo={`Meta anual ${administrativo.progresso.ano}`} valor={formatarMoedaReal(administrativo.metaAnual)} mono />
          <Campo rotulo="Meta mensal" valor={formatarMoedaReal(administrativo.progresso.metaMensal)} mono />
          <Campo rotulo={`Realizado em ${administrativo.progresso.ano}`} valor={`${formatarMoedaReal(administrativo.progresso.realizadoAcumulado)} (${Math.round(administrativo.progresso.percentualAnual)}% da meta)`} mono />
          <Campo rotulo="Meses declarados" valor={`${administrativo.progresso.mesesDeclarados} de 12 · ${administrativo.progresso.mesesAcimaDaMeta} na meta`} mono />
        </dl>

        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
          Declarações de faturamento ({administrativo.faturamentos.length})
          {" · "}
          <Link href="/painel/faturamento" style={{ fontSize: "12px", fontWeight: 500 }}>auditar ou editar</Link>
        </h3>
        {administrativo.faturamentos.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--cor-muted)", marginBottom: "var(--espaco-md)" }}>Nenhuma declaração registrada.</p>
        ) : (
          <div style={{ overflowX: "auto", marginBottom: "var(--espaco-md)" }}>
            <table style={TABELA}>
              <thead>
                <tr><th style={TH}>Mês</th><th style={{ ...TH, textAlign: "right" }}>Valor bruto</th><th style={TH}>Comprovantes</th><th style={TH}>Auditoria</th><th style={TH}>Enviado em</th></tr>
              </thead>
              <tbody>
                {administrativo.faturamentos.map((f) => (
                  <tr key={f.id}>
                    <td style={{ ...TD, fontWeight: 500 }}>{formatarMesReferencia(f.mesReferencia)}</td>
                    <td style={{ ...TD, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatarMoedaReal(f.valorBruto)}</td>
                    <td style={{ ...TD, fontSize: "12px", color: "var(--cor-text-muted)" }}>{f.comprovantes.length === 0 ? "Nenhum" : f.comprovantes.map((c) => c.nome).join(", ")}</td>
                    <td style={TD}>
                      <BadgeStatusAuditoria status={f.statusAuditoria} />
                      {f.auditadoPor && <div style={{ fontSize: "11px", color: "var(--cor-muted)", marginTop: "2px" }}>{f.auditadoPor} · {dataCurta(f.auditadoEm)}</div>}
                      {f.parecerAuditoria && <div style={{ fontSize: "12px", color: "var(--cor-text-muted)", marginTop: "2px" }}>{f.parecerAuditoria}</div>}
                    </td>
                    <td style={TD}>{dataCurta(f.criadoEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>Documentos associados ({administrativo.documentos.length})</h3>
        {administrativo.documentos.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--cor-muted)" }}>Nenhum documento anexado.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {administrativo.documentos.map((d, i) => (
              <li key={i}>
                <a href={`#download-${d.path}`}>{d.nome}</a>
                <span style={{ color: "var(--cor-muted)" }}> · {d.origem} · {d.tipo === "comprovante" ? "comprovante de faturamento" : "evidência de check-in"}</span>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {/* Canais (apenas quando o sistema tem esse dado para o aluno) */}
      {canais && (
        <Secao id="ficha-canais" titulo="Canais de atração">
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {canais.map((c) => (
              <li key={c.nome}>
                <StatusDot status={c.status === "ativo" ? "verde" : "neutro"} label={c.nome} size={6} />
                {c.url && <span style={{ color: "var(--cor-muted)" }}> · <a href={c.url} target="_blank" rel="noreferrer">{c.url}</a></span>}
                {c.status !== "ativo" && <span style={{ color: "var(--cor-muted)" }}> · não iniciado</span>}
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </div>
  );
}
