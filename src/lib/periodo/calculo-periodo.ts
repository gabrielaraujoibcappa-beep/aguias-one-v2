export type TipoPeriodo = "relativo" | "customizado";
export type AtalhoPeriodo = "hoje" | "ultimos_7d" | "ultimos_30d" | "mes_atual" | "ciclo_atual";
export type Granularidade = "dia" | "semana" | "mes";

export interface PeriodoFiltroState {
  tipo: TipoPeriodo;
  atalho?: AtalhoPeriodo;
  dataInicio: string; // ISO YYYY-MM-DD
  dataFim: string;    // ISO YYYY-MM-DD
  granularidade: Granularidade;
  fusoHorario: string;
  ultimaAtualizacao: Date;
  escopo: string;
}

export function formatarDataISO(data: Date): string {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function formatarDataBR(isoStr: string): string {
  if (!isoStr) return "";
  const partes = isoStr.split("-");
  if (partes.length !== 3) return isoStr;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function calcularIntervaloAtalho(
  atalho: AtalhoPeriodo,
  dataReferencia: Date = new Date()
): { dataInicio: string; dataFim: string; rotulo: string } {
  const ref = new Date(Date.UTC(dataReferencia.getUTCFullYear(), dataReferencia.getUTCMonth(), dataReferencia.getUTCDate()));
  const dataFim = formatarDataISO(ref);

  switch (atalho) {
    case "hoje":
      return { dataInicio: dataFim, dataFim, rotulo: "Hoje" };
    case "ultimos_7d": {
      const inicio = new Date(ref);
      inicio.setUTCDate(inicio.getUTCDate() - 7);
      return { dataInicio: formatarDataISO(inicio), dataFim, rotulo: "Últimos 7 dias" };
    }
    case "ultimos_30d": {
      const inicio = new Date(ref);
      inicio.setUTCDate(inicio.getUTCDate() - 30);
      return { dataInicio: formatarDataISO(inicio), dataFim, rotulo: "Últimos 30 dias" };
    }
    case "mes_atual": {
      const inicio = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
      return { dataInicio: formatarDataISO(inicio), dataFim, rotulo: "Mês atual" };
    }
    case "ciclo_atual": {
      return { dataInicio: "2026-08-01", dataFim, rotulo: "Ciclo ÁGUIAS ONE 2026.1" };
    }
    default:
      return { dataInicio: dataFim, dataFim, rotulo: "Personalizado" };
  }
}

export function validarIntervaloCustomizado(
  dataInicio: string,
  dataFim: string,
  permitirFuturo = false
): { valido: boolean; erro?: string } {
  if (!dataInicio || !dataFim) {
    return { valido: false, erro: "Informe a data inicial e a data final." };
  }
  if (dataInicio > dataFim) {
    return { valido: false, erro: "A data inicial não pode ser posterior à data final." };
  }
  if (!permitirFuturo) {
    const hojeStr = formatarDataISO(new Date());
    if (dataInicio > hojeStr || dataFim > hojeStr) {
      return { valido: false, erro: "O intervalo não pode conter datas futuras para métricas consolidadas." };
    }
  }
  return { valido: true };
}

export function formatarPeriodoLegivel(estado: PeriodoFiltroState): string {
  const inicioBR = formatarDataBR(estado.dataInicio);
  const fimBR = formatarDataBR(estado.dataFim);

  if (estado.tipo === "relativo" && estado.atalho) {
    const atalhoInfo = calcularIntervaloAtalho(estado.atalho, estado.ultimaAtualizacao);
    return `${atalhoInfo.rotulo} (${inicioBR} – ${fimBR})`;
  }
  return `Personalizado (${inicioBR} – ${fimBR})`;
}

export function criarPeriodoPadrao(escopo = "Global (Painel da Turma)"): PeriodoFiltroState {
  const agora = new Date();
  const { dataInicio, dataFim } = calcularIntervaloAtalho("ultimos_30d", agora);

  return {
    tipo: "relativo",
    atalho: "ultimos_30d",
    dataInicio,
    dataFim,
    granularidade: "semana",
    fusoHorario: "America/Sao_Paulo (UTC-3)",
    ultimaAtualizacao: agora,
    escopo,
  };
}
