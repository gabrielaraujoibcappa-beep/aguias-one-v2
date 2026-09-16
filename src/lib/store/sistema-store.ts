"use client";

import { useState, useEffect } from "react";
import { AlunoCadastro } from "../api/alunos";
import { TurmaCadastro } from "../api/turmas";
import { ModuloItem, MODULOS_PADRAO_AGUIAS_ONE } from "../api/modulos-liberacao";
import { DeclaracaoFaturamento, FATURAMENTOS_HISTORICO_MOCK, META_FATURAMENTO_ANUAL_PADRAO } from "../api/faturamento";
import { CanalItem, CANAIS_INICIAIS_MOCK } from "../api/canais";
import { EntregaPendente, ENTREGAS_MOCK } from "../api/auditoria";
import { AlunoSemaforoStatus, ALUNOS_SEMAFORO_MOCK } from "../api/turma-semaforo";
import { PapelUsuario } from "../auth/roles";

const STORAGE_KEY = "aguias_one_v2_store";

export interface SistemaState {
  papelAtual: PapelUsuario;
  usuarioAtual: {
    nome: string;
    email: string;
    turmaNome: string;
  };
  modulos: ModuloItem[];
  entregas: EntregaPendente[];
  faturamentos: DeclaracaoFaturamento[];
  metaFaturamentoAnual: number;
  canais: CanalItem[];
  alunos: AlunoCadastro[];
  turmas: TurmaCadastro[];
  alunosSemaforo: AlunoSemaforoStatus[];
}

const estadoInicial: SistemaState = {
  papelAtual: "mentorado",
  usuarioAtual: {
    nome: "Dr. Roberto Silva",
    email: "roberto.silva@pericia.com.br",
    turmaNome: "Águias ONE — Turma 2026.1",
  },
  modulos: MODULOS_PADRAO_AGUIAS_ONE,
  entregas: ENTREGAS_MOCK,
  faturamentos: FATURAMENTOS_HISTORICO_MOCK,
  metaFaturamentoAnual: META_FATURAMENTO_ANUAL_PADRAO,
  canais: CANAIS_INICIAIS_MOCK,
  alunos: [
    {
      id: "1",
      nome: "Dr. Roberto Silva",
      email: "roberto.silva@pericia.com.br",
      whatsapp: "(11) 98765-4321",
      cpf: "123.456.789-00",
      areaPericial: "Contábil e Financeira",
      turmaId: "turma-2026.1",
      turmaNome: "Águias ONE — Turma 2026.1",
      status: "ativo",
    },
    {
      id: "2",
      nome: "Dra. Mariana Costa",
      email: "mariana.costa@advpericia.com.br",
      whatsapp: "(21) 99887-7665",
      cpf: "234.567.890-11",
      areaPericial: "Trabalhista",
      turmaId: "turma-2026.1",
      turmaNome: "Águias ONE — Turma 2026.1",
      status: "ativo",
    },
    {
      id: "3",
      nome: "Dr. André Martins",
      email: "andre.martins@pericia.com.br",
      whatsapp: "(31) 97766-5544",
      cpf: "345.678.901-22",
      areaPericial: "Grafotécnica",
      turmaId: "turma-2026.1",
      turmaNome: "Águias ONE — Turma 2026.1",
      status: "ativo",
    },
  ],
  turmas: [
    {
      id: "turma-2026.1",
      codigo: "POS.ONE.2026.1",
      nome: "Águias ONE — Turma 2026.1",
      dataInicio: "2026-03-01",
      horarioEncontro: "Quartas, 18:15 às 19:45",
      limiteVagas: 40,
      totalMatriculados: 38,
      status: "em_andamento",
    },
    {
      id: "turma-2026.2",
      codigo: "POS.ONE.2026.2",
      nome: "Águias ONE — Turma 2026.2",
      dataInicio: "2026-08-01",
      horarioEncontro: "Quartas, 18:15 às 19:45",
      limiteVagas: 40,
      totalMatriculados: 12,
      status: "aberta",
    },
  ],
  alunosSemaforo: ALUNOS_SEMAFORO_MOCK,
};

export function useSistemaStore() {
  const [estado, setEstado] = useState<SistemaState>(estadoInicial);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const dados = { ...estadoInicial, ...JSON.parse(salvo) } as SistemaState;
        setEstado(dados);
        if (typeof document !== "undefined" && dados.papelAtual) {
          document.cookie = `user-role=${dados.papelAtual}; path=/; max-age=31536000; SameSite=Lax`;
        }
      } else {
        if (typeof document !== "undefined") {
          document.cookie = `user-role=mentorado; path=/; max-age=31536000; SameSite=Lax`;
        }
      }
    } catch {
      // fallback para estado inicial
    }
    setCarregado(true);
  }, []);

  const salvarEstado = (novo: SistemaState) => {
    setEstado(novo);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(novo));
      if (typeof document !== "undefined" && novo.papelAtual) {
        document.cookie = `user-role=${novo.papelAtual}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      // ignore
    }
  };

  const mudarPapel = (novoPapel: PapelUsuario) => {
    salvarEstado({ ...estado, papelAtual: novoPapel });
  };

  const alternarModulo = (moduloId: string, novoStatus: "liberado" | "bloqueado") => {
    const modulosAtualizados = estado.modulos.map((m) =>
      m.id === moduloId ? { ...m, status: novoStatus, liberadoEm: novoStatus === "liberado" ? new Date().toISOString() : undefined } : m
    );
    salvarEstado({ ...estado, modulos: modulosAtualizados });
  };

  const submeterCheckin = (entrega: EntregaPendente) => {
    salvarEstado({
      ...estado,
      entregas: [entrega, ...estado.entregas.filter((e) => e.id !== entrega.id)],
    });
  };

  const auditarEntrega = (id: string, decisao: "aprovado" | "ajuste_solicitado", parecer?: string) => {
    const entregasAtualizadas = estado.entregas.map((e) =>
      e.id === id
        ? {
            ...e,
            status: decisao,
            parecerTexto: parecer,
            avaliadoEm: new Date().toISOString(),
            avaliadoPor: estado.papelAtual === "anjo" ? "Ana Carolina (Anjo)" : "Flávio Lopes (Concierge)",
          }
        : e
    );
    salvarEstado({ ...estado, entregas: entregasAtualizadas });
  };

  const adicionarFaturamento = (faturamento: DeclaracaoFaturamento) => {
    salvarEstado({
      ...estado,
      faturamentos: [faturamento, ...estado.faturamentos],
    });
  };

  const definirMetaFaturamentoAnual = (valor: number) => {
    const metaValida = Number.isFinite(valor) && valor > 0 ? valor : META_FATURAMENTO_ANUAL_PADRAO;
    salvarEstado({ ...estado, metaFaturamentoAnual: metaValida });
  };

  const atualizarCanal = (nomeCanal: string, status: "ativo" | "nao_iniciado", url?: string) => {
    const canaisAtualizados = estado.canais.map((c) =>
      c.nome === nomeCanal ? { ...c, status, url: url ?? c.url, atualizadoEm: new Date().toISOString() } : c
    );
    salvarEstado({ ...estado, canais: canaisAtualizados });
  };

  const salvarAluno = (aluno: AlunoCadastro) => {
    const existe = estado.alunos.some((a) => a.id === aluno.id);
    let novosAlunos: AlunoCadastro[];
    if (existe) {
      novosAlunos = estado.alunos.map((a) => (a.id === aluno.id ? aluno : a));
    } else {
      novosAlunos = [{ ...aluno, id: aluno.id || String(Date.now()) }, ...estado.alunos];
    }
    salvarEstado({ ...estado, alunos: novosAlunos });
  };

  const excluirAluno = (id: string) => {
    salvarEstado({ ...estado, alunos: estado.alunos.filter((a) => a.id !== id) });
  };

  const salvarTurma = (turma: TurmaCadastro) => {
    salvarEstado({ ...estado, turmas: [turma, ...estado.turmas] });
  };

  return {
    estado,
    carregado,
    mudarPapel,
    alternarModulo,
    submeterCheckin,
    auditarEntrega,
    adicionarFaturamento,
    definirMetaFaturamentoAnual,
    atualizarCanal,
    salvarAluno,
    excluirAluno,
    salvarTurma,
  };
}
