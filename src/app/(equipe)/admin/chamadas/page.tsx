"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useSistemaStore } from "@/lib/store/sistema-store";
import {
  obterRelatorioPresencas,
  criarEncontro,
  salvarPresencas,
  Encontro,
  StatusPresenca,
  RelatorioPresencas,
} from "@/lib/api/chamadas";
import {
  IconUsers,
  IconPlus,
  IconCheckCircle,
  IconX,
  IconClock,
  IconCalendar,
} from "@/components/ui/Icons";

const OPCOES_PRESENCA: { status: StatusPresenca; rotulo: string; icone: React.ReactNode }[] = [
  { status: "presente", rotulo: "Presente", icone: <IconCheckCircle size={14} /> },
  { status: "justificada", rotulo: "Justificada", icone: <IconClock size={14} /> },
  { status: "falta", rotulo: "Falta", icone: <IconX size={14} /> },
];

function formatarData(data: string) {
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function AdminChamadasPage() {
  const { estado, carregado } = useSistemaStore();
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("");
  const [dadosTurma, setDadosTurma] = useState<RelatorioPresencas | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<string>("historico");

  // Novo encontro
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaData, setNovaData] = useState("");
  const [criando, setCriando] = useState(false);

  // Chamada interativa
  const [encontroEditando, setEncontroEditando] = useState<Encontro | null>(null);
  const [presencasAtuais, setPresencasAtuais] = useState<Record<string, StatusPresenca>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (carregado && estado.turmas.length > 0 && !turmaSelecionada) {
      setTurmaSelecionada(estado.turmas[0].id);
    }
  }, [carregado, estado.turmas, turmaSelecionada]);

  const carregarDadosDaTurma = useCallback(async (id: string) => {
    setCarregando(true);
    setErro(null);
    try {
      setDadosTurma(await obterRelatorioPresencas(id));
    } catch (err) {
      setErro(`Não foi possível carregar os encontros desta turma: ${(err as Error).message}`);
      setDadosTurma(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (turmaSelecionada) {
      setEncontroEditando(null);
      carregarDadosDaTurma(turmaSelecionada);
    }
  }, [turmaSelecionada, carregarDadosDaTurma]);

  const handleCriarEncontro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo || !novaData || !turmaSelecionada) return;

    setCriando(true);
    setErro(null);
    try {
      await criarEncontro({
        turma_id: turmaSelecionada,
        titulo: novoTitulo,
        data_encontro: novaData,
      });
      setNovoTitulo("");
      setNovaData("");
      setAbaAtiva("historico");
      await carregarDadosDaTurma(turmaSelecionada);
    } catch (err) {
      setErro(`Não foi possível criar o encontro: ${(err as Error).message}`);
    } finally {
      setCriando(false);
    }
  };

  const iniciarChamada = (encontro: Encontro) => {
    if (!dadosTurma) return;
    const mapa: Record<string, StatusPresenca> = {};
    dadosTurma.alunos.forEach((aluno) => {
      const p = dadosTurma.presencas.find(
        (pr) => pr.encontro_id === encontro.id && pr.matricula_id === aluno.matricula_id
      );
      mapa[aluno.matricula_id] = p ? p.status : "falta";
    });
    setPresencasAtuais(mapa);
    setErro(null);
    setEncontroEditando(encontro);
  };

  const alternarPresenca = (matricula_id: string, status: StatusPresenca) => {
    setPresencasAtuais((prev) => ({ ...prev, [matricula_id]: status }));
  };

  const marcarTodos = (status: StatusPresenca) => {
    setPresencasAtuais((prev) => {
      const novo: Record<string, StatusPresenca> = {};
      Object.keys(prev).forEach((id) => (novo[id] = status));
      return novo;
    });
  };

  const salvarChamada = async () => {
    if (!encontroEditando) return;
    setSalvando(true);
    setErro(null);
    const lista = Object.entries(presencasAtuais).map(([matricula_id, status]) => ({
      matricula_id,
      status,
    }));
    try {
      await salvarPresencas(encontroEditando.id, lista);
      setEncontroEditando(null);
      await carregarDadosDaTurma(turmaSelecionada);
    } catch (err) {
      setErro(`Erro ao salvar a chamada: ${(err as Error).message}`);
    } finally {
      setSalvando(false);
    }
  };

  if (!carregado) return null;

  const encontrosOrdenados = [...(dadosTurma?.encontros ?? [])].sort((a, b) =>
    b.data_encontro.localeCompare(a.data_encontro)
  );

  const contagemAtual = Object.values(presencasAtuais).reduce(
    (acc, s) => ({ ...acc, [s]: acc[s] + 1 }),
    { presente: 0, justificada: 0, falta: 0 } as Record<StatusPresenca, number>
  );

  const conteudoHistorico = carregando ? (
    <div className="adm-vazio">Carregando encontros…</div>
  ) : encontrosOrdenados.length === 0 ? (
    <div className="adm-vazio">
      <IconCalendar size={28} />
      <h3>Nenhum encontro registrado</h3>
      <p>Crie um encontro para começar a registrar as presenças.</p>
      <Button variante="secundario" iconeInicio={<IconPlus />} onClick={() => setAbaAtiva("novo")}>
        Criar primeiro encontro
      </Button>
    </div>
  ) : (
    <div className="adm-lista-encontros">
      {encontrosOrdenados.map((enc) => {
        const presencasEnc = dadosTurma!.presencas.filter((p) => p.encontro_id === enc.id);
        const presentes = presencasEnc.filter((p) => p.status === "presente").length;
        const justificadas = presencasEnc.filter((p) => p.status === "justificada").length;
        const faltas = presencasEnc.length - presentes - justificadas;
        const temChamada = presencasEnc.length > 0;

        return (
          <div key={enc.id} className="adm-encontro">
            <div>
              <h3>{enc.titulo}</h3>
              <p className="adm-encontro-meta">
                {formatarData(enc.data_encontro)} · {presencasEnc.length}/{dadosTurma!.alunos.length} alunos registrados
              </p>
              <div className="adm-chips">
                {temChamada ? (
                  <>
                    <span className="adm-chip presente">{presentes} presentes</span>
                    <span className="adm-chip justificada">{justificadas} justificadas</span>
                    <span className="adm-chip falta">{faltas} faltas</span>
                  </>
                ) : (
                  <span className="adm-chip neutro">Chamada pendente</span>
                )}
              </div>
            </div>
            <Button
              variante={temChamada ? "secundario" : "primario"}
              onClick={() => iniciarChamada(enc)}
            >
              {temChamada ? "Editar chamada" : "Fazer chamada"}
            </Button>
          </div>
        );
      })}
    </div>
  );

  const conteudoNovo = (
    <form onSubmit={handleCriarEncontro} className="adm-form-encontro">
      <label className="adm-campo">
        <span className="adm-rotulo">Título do encontro</span>
        <input
          className="adm-input"
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
          placeholder="Ex: Encontro 01 — Abertura e Networking"
          required
        />
      </label>
      <label className="adm-campo">
        <span className="adm-rotulo">Data</span>
        <input
          className="adm-input"
          type="date"
          value={novaData}
          onChange={(e) => setNovaData(e.target.value)}
          required
        />
      </label>
      <div>
        <Button type="submit" carregando={criando} textoCarregando="Criando…" iconeInicio={<IconPlus />}>
          Agendar encontro
        </Button>
      </div>
    </form>
  );

  return (
    <div className="adm-pagina">
      <div className="adm-cabecalho">
        <div>
          <h1 className="adm-titulo">
            <IconUsers size={26} />
            Chamadas
          </h1>
          <p className="adm-subtitulo">Registre as presenças dos encontros ao vivo de cada turma.</p>
        </div>
        {estado.turmas.length > 0 && (
          <label className="adm-campo">
            <span className="adm-rotulo">Turma</span>
            <select
              className="adm-input"
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
              disabled={!!encontroEditando}
            >
              {estado.turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {erro && (
        <div className="adm-alerta-erro" role="alert">
          {erro}
        </div>
      )}

      {estado.turmas.length === 0 ? (
        <div className="card">
          <div className="adm-vazio">
            <h3>Nenhuma turma cadastrada</h3>
            <p>Cadastre uma turma em Gestão de Turmas para registrar chamadas.</p>
          </div>
        </div>
      ) : encontroEditando && dadosTurma ? (
        <div className="card adm-card-sem-padding">
          <div className="adm-chamada-topo">
            <div>
              <h2>{encontroEditando.titulo}</h2>
              <p className="adm-encontro-meta">
                {formatarData(encontroEditando.data_encontro)} · {dadosTurma.alunos.length} alunos ·{" "}
                {contagemAtual.presente} presentes, {contagemAtual.justificada} justificadas,{" "}
                {contagemAtual.falta} faltas
              </p>
            </div>
            <div className="adm-acoes">
              <Button variante="terciario" tamanho="sm" onClick={() => marcarTodos("presente")} disabled={salvando}>
                Todos presentes
              </Button>
              <Button variante="secundario" onClick={() => setEncontroEditando(null)} disabled={salvando}>
                Cancelar
              </Button>
              <Button onClick={salvarChamada} carregando={salvando} textoCarregando="Salvando…">
                Salvar chamada
              </Button>
            </div>
          </div>

          {dadosTurma.alunos.length === 0 ? (
            <div style={{ padding: "var(--espaco-xl)" }}>
              <div className="adm-vazio">
                <h3>Nenhum aluno matriculado</h3>
                <p>Matricule alunos nesta turma para registrar a chamada.</p>
              </div>
            </div>
          ) : (
            <table className="adm-tabela adm-tabela-chamada">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th style={{ width: 1, whiteSpace: "nowrap" }}>Presença</th>
                </tr>
              </thead>
              <tbody>
                {dadosTurma.alunos.map((aluno) => {
                  const statusAtual = presencasAtuais[aluno.matricula_id];
                  return (
                    <tr key={aluno.matricula_id}>
                      <td>
                        <div className="adm-aluno-nome">{aluno.nome ?? "Aluno sem nome"}</div>
                        <div className="adm-aluno-email">{aluno.email}</div>
                      </td>
                      <td>
                        <div className="adm-segmentado" role="group" aria-label={`Presença de ${aluno.nome ?? "aluno"}`}>
                          {OPCOES_PRESENCA.map((op) => (
                            <button
                              key={op.status}
                              type="button"
                              className={op.status}
                              aria-pressed={statusAtual === op.status}
                              onClick={() => alternarPresenca(aluno.matricula_id, op.status)}
                            >
                              {op.icone}
                              {op.rotulo}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card">
          <Tabs
            ariaLabel="Encontros da turma"
            activeTabId={abaAtiva}
            onChange={setAbaAtiva}
            tabs={[
              {
                id: "historico",
                label: "Histórico de encontros",
                badge: dadosTurma ? dadosTurma.encontros.length : undefined,
                content: conteudoHistorico,
              },
              { id: "novo", label: "Novo encontro", content: conteudoNovo },
            ]}
          />
        </div>
      )}
    </div>
  );
}
