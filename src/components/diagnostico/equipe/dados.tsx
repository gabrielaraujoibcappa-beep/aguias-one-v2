"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FalhaApi, chamarApi } from "@/lib/diagnostico/cliente";
import type { PayloadDiagnostico } from "@/lib/diagnostico/campos";
import type { ScoresDiagnostico, StatusDiagnostico } from "@/lib/diagnostico/regras";
import type { StatusVariant } from "@/components/ui/StatusDot";
import type { NotaAnjo } from "./NotasAnjo";
import type { FaturamentoMes } from "./FaturamentoDeclarado";
import type { TurmaOpcao } from "./SeletorTurma";

export type Cor = "verde" | "amarelo" | "vermelho";

export interface CardAluno {
  matriculaId: string;
  usuarioId?: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  matriculadoEm: string;
  diagnosticoStatus: StatusDiagnostico;
  diagnosticoAtrasado: boolean;
  enviadoEm: string | null;
  travou: string | null;
  /** Semanas vermelhas cujo início caiu nos últimos 28 dias (semaforo_semanal). */
  vermelhos28d?: number;
  scores: Partial<ScoresDiagnostico>;
  media3mCentavos?: number | null;
  semaforo?: Cor | null;
  motivoSemaforo?: string | null;
}

export interface FichaDiagnostico {
  aluno: { matriculaId: string; nome: string; email: string; whatsapp: string | null; turma: string | null; matriculadoEm: string };
  diagnostico: {
    status: StatusDiagnostico;
    payload: PayloadDiagnostico;
    scores: Partial<ScoresDiagnostico>;
    enviadoEm: string | null;
    congeladoEm: string | null;
    corrigirAte: string | null;
    atrasado: boolean;
    versao: number;
    mesesReferencia: string[];
  };
  faturamentoMensal: FaturamentoMes[];
  notas?: NotaAnjo[];
  plano: Record<string, any> | null;
  auditoria?: {
    acessos: { origem: string; papel: string; nome: string; em: string }[];
    eventos: { codigo: string; papel: string | null; nome: string; dados: Record<string, any>; em: string }[];
  };
}

/** Régua do mês 6 em dias a partir da matrícula. [A CONFIRMAR — Edilson]: primeira quarta ou matrícula. */
export const DIAS_ATE_MES_6 = 180;

export function diasAteMes6(matriculadoEm: string, agora = new Date()): number {
  const alvo = new Date(matriculadoEm).getTime() + DIAS_ATE_MES_6 * 24 * 60 * 60 * 1000;
  return Math.ceil((alvo - agora.getTime()) / (24 * 60 * 60 * 1000));
}

export function corParaDot(cor: Cor | null | undefined): StatusVariant {
  return cor ?? "neutro";
}

export const ROTULOS_COR: Record<Cor, string> = { verde: "Verde", amarelo: "Amarelo", vermelho: "Vermelho" };

function mensagemErro(err: unknown): string {
  if (err instanceof FalhaApi) {
    if (err.status === 403) return "Seu papel não acessa esta tela.";
    if (err.status === 401) return "Sessão expirada. Entre novamente.";
    return err.message;
  }
  return "Não foi possível carregar os dados.";
}

/** Cards da turma (/api/diagnosticos) cruzados com o semáforo (/api/semaforo). */
export function useTurmaAcompanhamento() {
  const [turmaId, setTurmaId] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<TurmaOpcao[]>([]);
  const [alunos, setAlunos] = useState<CardAluno[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (id: string | null) => {
    setCarregando(true);
    setErro(null);
    try {
      const qs = id ? `?turma=${encodeURIComponent(id)}` : "";
      const lista = await chamarApi<{ turma: TurmaOpcao | null; turmas: TurmaOpcao[]; alunos: CardAluno[] }>(`/api/diagnosticos${qs}`);
      const idEfetivo = lista.turma?.id ?? null;
      let semaforo = new Map<string, { status: Cor; motivo: string }>();
      if (idEfetivo) {
        try {
          const s = await chamarApi<{ alunos: { matriculaId: string; statusSemaforo: Cor; motivoSemaforo: string }[] }>(
            `/api/semaforo?turmaId=${encodeURIComponent(idEfetivo)}`
          );
          semaforo = new Map(s.alunos.map((a) => [a.matriculaId, { status: a.statusSemaforo, motivo: a.motivoSemaforo }]));
        } catch {
          // semáforo indisponível não impede a mesa
        }
      }
      setTurmas(lista.turmas || []);
      setTurmaId(idEfetivo);
      setAlunos(
        lista.alunos.map((a) => ({
          ...a,
          semaforo: semaforo.get(a.matriculaId)?.status ?? null,
          motivoSemaforo: semaforo.get(a.matriculaId)?.motivo ?? null,
        }))
      );
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(null);
  }, [carregar]);

  return { turmaId, turmas, alunos, carregando, erro, trocarTurma: (id: string) => carregar(id) };
}

/** Ficha (/api/diagnostico/:matricula) + semáforo e usuarioId da turma padrão, quando encontrados. */
export function useFicha(matriculaId: string) {
  const [ficha, setFicha] = useState<FichaDiagnostico | null>(null);
  const [extra, setExtra] = useState<{ semaforo: Cor | null; motivo: string | null; usuarioId: string | null; travou: string | null }>({
    semaforo: null,
    motivo: null,
    usuarioId: null,
    travou: null,
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro(null);
      try {
        const dados = await chamarApi<FichaDiagnostico>(`/api/diagnostico/${encodeURIComponent(matriculaId)}`);
        if (!ativo) return;
        setFicha(dados);
        const aluno = (dados as any).aluno as { usuarioId?: string | null; turmaId?: string | null; travou?: string | null };
        // Semáforo da turma da própria matrícula; falha aqui não bloqueia a ficha
        let semaforo: Cor | null = null;
        let motivo: string | null = null;
        if (aluno?.turmaId) {
          try {
            const s = await chamarApi<{ alunos: { matriculaId: string; statusSemaforo: Cor; motivoSemaforo: string }[] }>(
              `/api/semaforo?turmaId=${encodeURIComponent(aluno.turmaId)}`
            );
            const linha = s.alunos.find((a) => a.matriculaId === matriculaId);
            semaforo = linha?.statusSemaforo ?? null;
            motivo = linha?.motivoSemaforo ?? null;
          } catch {
            // semáforo indisponível: ficha segue sem ele
          }
        }
        if (ativo) setExtra({ semaforo, motivo, usuarioId: aluno?.usuarioId ?? null, travou: aluno?.travou ?? null });
      } catch (err) {
        if (ativo) setErro(mensagemErro(err));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [matriculaId]);

  return { ficha, extra, carregando, erro };
}

export function EstadoCarregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <p role="status" style={{ color: "var(--cor-muted)" }}>
      {texto}
    </p>
  );
}

export function EstadoErro({ mensagem, voltar }: { mensagem: string; voltar?: { href: string; rotulo: string } }) {
  return (
    <div>
      <p className="adm-alerta-erro" role="alert">
        {mensagem}
      </p>
      {voltar && (
        <Link href={voltar.href} className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
          {voltar.rotulo}
        </Link>
      )}
    </div>
  );
}
