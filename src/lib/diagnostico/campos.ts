/**
 * Placar de entrada (diagnóstico) — definição dos campos.
 * Fonte: 06-sistema/SPEC-DIAGNOSTICO-E-ACOMPANHAMENTO.md §4.
 *
 * Os campo_id são o contrato com o banco (diagnostico.payload), com o import
 * da Turma 1 e com o formulário-ponte. Não renomear.
 */

export type Consumo = "ops" | "icp" | "ambos";

export type TipoCampo = "bool" | "texto" | "enum" | "multi" | "inteiro" | "centavos";

export interface OpcaoCampo {
  valor: string;
  rotulo: string;
}

export interface CampoDiagnostico {
  id: string;
  tipo: TipoCampo;
  rotulo: string;
  consumo: Consumo;
  obrigatorio?: boolean;
  opcoes?: OpcaoCampo[];
  maxChars?: number;
  minChars?: number;
  min?: number;
  max?: number;
  maxSelecoes?: number;
  ajuda?: string;
  placeholder?: string;
  /** Campo só aparece (e só é exigido) quando a condição é verdadeira. */
  mostrarSe?: (p: PayloadDiagnostico) => boolean;
}

export interface BlocoDiagnostico {
  numero: number;
  titulo: string;
  instrucao?: string;
  campos: CampoDiagnostico[];
}

export type ValorCampo = string | number | boolean | string[] | null | undefined;
export type PayloadDiagnostico = Record<string, ValorCampo>;

const op = (valor: string, rotulo: string): OpcaoCampo => ({ valor, rotulo });

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB",
  "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
];

export const NUM_MESES_PLACAR = 6;
export const FONTES_MES = ["extrato", "nota", "memoria", "nao_sei"] as const;
export const PARCELAS_MES = ["pericia", "at", "escritorio", "outro"] as const;
export type ParcelaMes = (typeof PARCELAS_MES)[number];

export const ROTULOS_PARCELA: Record<ParcelaMes, string> = {
  pericia: "Perícia judicial (nomeação)",
  at: "Assistente técnico / parecer para parte",
  escritorio: "Escritório contábil / honorários recorrentes",
  outro: "Outro",
};

export const ROTULOS_FONTE: Record<(typeof FONTES_MES)[number], string> = {
  extrato: "Extrato",
  nota: "Nota fiscal",
  memoria: "Memória",
  nao_sei: "Não sei",
};

/** Chave do payload para um mês do placar: mes_1.pericia, mes_1.fonte… */
export const chaveMes = (n: number, parte: ParcelaMes | "fonte" | "ref") => `mes_${n}.${parte}`;

const temTrabalho = (p: PayloadDiagnostico) => Number(p.trabalhos_6m) > 0;

export const PECAS_DE_PE: OpcaoCampo[] = [
  op("peca.placar", "Placar dos 6 meses escrito (além deste formulário)"),
  op("peca.agenda", "Agenda blocada (produzir / revisar / vender / organizar)"),
  op("peca.pasta", "Pasta do Drive com árvore"),
  op("peca.site_email", "Site no ar e e-mail do domínio"),
  op("peca.leads", "Cadastro de leads (não é a cabeça)"),
  op("peca.preco", "Preço escrito antes do cliente perguntar"),
  op("peca.prateleira", "Prateleira com produto, prazo e preço"),
  op("peca.whatsapp", "Catálogo no WhatsApp com preço visível"),
  op("peca.gmn", "Ficha do Google Meu Negócio no ar"),
  op("peca.caixa", "Conta PJ separada da PF"),
];

/** Campos de texto livre identificáveis: só mentor/admin leem (com log). */
export const CAMPOS_FRASE = [
  "job_frase",
  "frase_sabado",
  "frase_preco",
  "frase_sozinho",
  "ultima_vez_organizou",
] as const;

function forca(id: string, rotulo: string, opcoes: OpcaoCampo[]): CampoDiagnostico[] {
  return [
    { id, tipo: "enum", rotulo, consumo: "icp", obrigatorio: true, opcoes },
    {
      id: `${id}_outro`,
      tipo: "texto",
      rotulo: "Qual",
      consumo: "icp",
      obrigatorio: true,
      maxChars: 80,
      mostrarSe: (p) => p[id] === "outro",
    },
  ];
}

export const BLOCOS: BlocoDiagnostico[] = [
  {
    numero: 1,
    titulo: "Quem opera",
    campos: [
      { id: "crc_ativo", tipo: "bool", rotulo: "Você tem CRC ativo?", consumo: "ambos", obrigatorio: true },
      {
        id: "crc_obs",
        tipo: "texto",
        rotulo: "O que você tem no lugar (CRA, outro conselho, nenhum)",
        consumo: "ambos",
        obrigatorio: true,
        maxChars: 140,
        mostrarSe: (p) => p.crc_ativo === false,
      },
      {
        id: "papel_principal",
        tipo: "enum",
        rotulo: "De onde veio a maior parte do dinheiro nos últimos 6 meses?",
        consumo: "ambos",
        obrigatorio: true,
        opcoes: [
          op("pericia_judicial", "Perícia judicial"),
          op("assistente_tecnico", "Assistente técnico"),
          op("escritorio_contabil", "Escritório contábil"),
          op("clt_mais_bico", "CLT + bico"),
          op("outro", "Outro"),
        ],
      },
      {
        id: "papel_outro",
        tipo: "texto",
        rotulo: "Qual",
        consumo: "ambos",
        obrigatorio: true,
        maxChars: 80,
        mostrarSe: (p) => p.papel_principal === "outro",
      },
      {
        id: "estrutura",
        tipo: "enum",
        rotulo: "Com quem você trabalha hoje?",
        consumo: "ambos",
        obrigatorio: true,
        opcoes: [
          op("sozinho", "Sozinho"),
          op("um_apoio", "Um apoio (assistente, estagiário ou parceiro, sem folha)"),
          op("equipe_folha", "Equipe com folha de pagamento"),
        ],
      },
      {
        id: "uf",
        tipo: "enum",
        rotulo: "UF principal de atuação",
        consumo: "ambos",
        obrigatorio: true,
        opcoes: UFS.map((uf) => op(uf, uf)),
      },
      {
        id: "comarca_principal",
        tipo: "texto",
        rotulo: "Comarca ou cidade onde mais atua",
        consumo: "ambos",
        maxChars: 80,
      },
    ],
  },
  {
    numero: 2,
    titulo: "O número",
    instrucao: "Tira do extrato, não da memória. Se não souber um mês, deixa em branco — em branco não é zero.",
    // Campos mes_N.* são renderizados por um componente próprio (grade de 6 meses)
    campos: [],
  },
  {
    numero: 3,
    titulo: "Porta e preço",
    campos: [
      {
        id: "trabalhos_6m",
        tipo: "inteiro",
        rotulo: "Quantos trabalhos você fechou e cobrou nos últimos 6 meses?",
        consumo: "ambos",
        obrigatorio: true,
        min: 0,
        max: 99,
      },
      {
        id: "ultimo_origem",
        tipo: "multi",
        rotulo: "O último trabalho que você cobrou: de onde veio?",
        consumo: "ambos",
        obrigatorio: true,
        maxSelecoes: 3,
        mostrarSe: temTrabalho,
        opcoes: [
          op("indicacao_advogado", "Indicação de advogado"),
          op("nomeacao_juiz", "Nomeação do juiz"),
          op("cliente_antigo", "Cliente antigo"),
          op("google", "Google"),
          op("instagram", "Instagram"),
          op("whatsapp_ativo", "WhatsApp ativo"),
          op("outro_perito", "Outro perito"),
          op("nao_lembro", "Não lembro"),
        ],
      },
      {
        id: "ultimo_preco_escrito",
        tipo: "enum",
        rotulo: "Quando o cliente perguntou o preço, ele já estava escrito?",
        consumo: "ambos",
        obrigatorio: true,
        mostrarSe: temTrabalho,
        opcoes: [
          op("sim_antes", "Sim, já estava escrito antes"),
          op("inventei_na_hora", "Inventei na hora"),
          op("ainda_nao_perguntaram", "Ainda não perguntaram"),
        ],
      },
      {
        id: "ultimo_valor",
        tipo: "centavos",
        rotulo: "Quanto cobrou nesse último",
        consumo: "ambos",
        ajuda: "Se não lembrar, pule.",
        min: 0,
        mostrarSe: temTrabalho,
      },
      {
        id: "origens_distintas_6m",
        tipo: "inteiro",
        rotulo: "Nesses 6 meses, de quantas origens diferentes veio trabalho?",
        consumo: "ambos",
        obrigatorio: true,
        min: 0,
        max: 9,
        ajuda: "1 = porta única.",
        mostrarSe: temTrabalho,
      },
    ],
  },
  {
    numero: 4,
    titulo: "O que já tentou",
    campos: [
      {
        id: "pagou_casa",
        tipo: "multi",
        rotulo: "O que você já pagou na IBCAPPA/UniBCAPPA?",
        consumo: "icp",
        obrigatorio: true,
        opcoes: [
          op("comunidade", "Comunidade"),
          op("premium", "Premium"),
          op("decada_ouro", "Década de Ouro"),
          op("pos", "Pós-graduação"),
          op("mentoria_aguias", "Mentoria Águias"),
          op("express", "Express"),
          op("nada", "Nada"),
          op("nao_sei", "Não sei"),
        ],
      },
      {
        id: "anos_casa",
        tipo: "enum",
        rotulo: "Há quanto tempo acompanha o Edilson?",
        consumo: "icp",
        obrigatorio: true,
        mostrarSe: (p) => {
          const v = Array.isArray(p.pagou_casa) ? p.pagou_casa : [];
          return v.length > 0 && !(v.length === 1 && v[0] === "nada");
        },
        opcoes: [
          op("menos_1", "Menos de 1 ano"),
          op("1_a_2", "1 a 2 anos"),
          op("2_a_4", "2 a 4 anos"),
          op("mais_4", "Mais de 4 anos"),
        ],
      },
      {
        id: "largou_12m",
        tipo: "multi",
        rotulo: "Nos últimos 12 meses, o que você começou e largou?",
        consumo: "icp",
        obrigatorio: true,
        opcoes: [
          op("curso_gravado", "Curso gravado"),
          op("mentoria", "Mentoria"),
          op("pos", "Pós-graduação"),
          op("planilha_propria", "Planilha própria"),
          op("instagram", "Instagram"),
          op("site", "Site"),
          op("nada", "Nada"),
        ],
      },
      {
        id: "ultima_vez_organizou",
        tipo: "texto",
        rotulo:
          "Conte a última vez que você sentou para organizar o escritório. O que fez, o que sobrou de pé, quando foi.",
        consumo: "icp",
        obrigatorio: true,
        minChars: 12,
        maxChars: 280,
        placeholder: "Em junho tentei montar a pasta. Ficou a meia. Não voltei.",
      },
    ],
  },
  {
    numero: 5,
    titulo: "Peças de pé",
    instrucao: "Uma a uma. “Meio” não existe. “Consigo abrir agora se pedir” = sim.",
    campos: PECAS_DE_PE.map((p) => ({
      id: p.valor,
      tipo: "bool" as const,
      rotulo: p.rotulo,
      consumo: "ops" as const,
      obrigatorio: true,
    })),
  },
  {
    numero: 6,
    titulo: "A decisão de entrar",
    instrucao: "Sobre a decisão de entrar no ÁGUIAS ONE. Marca a que mais pesou. Uma por linha.",
    campos: [
      ...forca("forca_push", "O que ficou insuportável", [
        op("mes_nao_repete", "O mês bom não se repete"),
        op("sabado_laudo", "Sábado no laudo"),
        op("paguei_e_nao_fiz", "Paguei e não fiz"),
        op("nao_quero_funcionario", "Não quero funcionário"),
        op("preco_na_hora", "Inventar preço na hora"),
        op("outro", "Outro"),
      ]),
      ...forca("forca_pull", "O que te puxou", [
        op("alguem_olha_meu_nome", "Alguém olha o meu nome"),
        op("ordem_pronta", "Ordem pronta"),
        op("empresa_de_um", "Empresa de um"),
        op("certifica_como_pos", "Certifica como pós"),
        op("edilson_hot_seat", "Edilson no Hot Seat"),
        op("outro", "Outro"),
      ]),
      ...forca("forca_anxiety", "O que quase te segurou", [
        op("parcela_900", "A parcela de R$ 900"),
        op("mais_um_curso", "Ser mais um curso"),
        op("vergonha_de_mostrar", "Vergonha de mostrar"),
        op("nao_sou_o_publico", "Não sou o público"),
        op("nao_tenho_tempo", "Não tenho tempo"),
        op("outro", "Outro"),
      ]),
      {
        id: "forca_habit",
        tipo: "enum",
        rotulo: "O que você faria se não tivesse comprado",
        consumo: "icp",
        obrigatorio: true,
        opcoes: [
          op("continuar_comunidade", "Continuar na Comunidade"),
          op("esperar_nomeacao", "Esperar nomeação"),
          op("outro_curso", "Outro curso"),
          op("nada", "Nada"),
          op("nao_sei", "Não sei"),
        ],
      },
      {
        id: "job_frase",
        tipo: "texto",
        rotulo: "Completa: Quando [situação], eu preciso [ação], para [resultado]. Usa a sua vida, não o nome do produto.",
        consumo: "icp",
        obrigatorio: true,
        minChars: 12,
        maxChars: 280,
        placeholder:
          "Quando o mês fecha no zero, eu preciso de uma porta que não dependa de indicação, para o mês seguinte não ser sorte.",
      },
    ],
  },
  {
    numero: 7,
    titulo: "Rotina e meta de 6 meses",
    campos: [
      {
        id: "horas_semana_reais",
        tipo: "inteiro",
        rotulo:
          "Numa semana normal, quantas horas você consegue dar para o escritório (não para o laudo do juiz)? O real, não o ideal.",
        consumo: "ops",
        obrigatorio: true,
        min: 0,
        max: 80,
      },
      {
        id: "melhor_faixa",
        tipo: "enum",
        rotulo: "Qual faixa da semana é a menos pior?",
        consumo: "ops",
        obrigatorio: true,
        opcoes: [
          op("manha_util", "Manhã de dia útil"),
          op("almoco", "Almoço"),
          op("noite", "Noite"),
          op("sabado", "Sábado"),
          op("nao_tenho", "Não tenho"),
        ],
      },
      {
        id: "meta_6m",
        tipo: "centavos",
        rotulo:
          "Daqui a 6 meses, qual média mensal bruta você considera feita — o número que, se não chegar, a gente para e o Anjo senta com você?",
        consumo: "ops",
        obrigatorio: true,
        min: 1,
        ajuda: "Não é 20 mil. É o seu.",
      },
      {
        id: "parcela_aperta",
        tipo: "enum",
        rotulo: "A parcela de R$ 900 (ou o à vista que você pagou) aperta o mês?",
        consumo: "ops",
        obrigatorio: true,
        opcoes: [op("nao", "Não"), op("aperta_mas_cabe", "Aperta, mas cabe"), op("aperta_muito", "Aperta muito")],
      },
    ],
  },
  {
    numero: 8,
    titulo: "Nas suas palavras",
    instrucao: "Três frases, depois acaba.",
    campos: [
      {
        id: "frase_sabado",
        tipo: "texto",
        rotulo: "Escreve a frase que você falaria para um colega sobre o seu sábado.",
        consumo: "icp",
        obrigatorio: true,
        minChars: 12,
        maxChars: 280,
        placeholder: "Sábado eu ainda estou no laudo e a família no outro cômodo.",
      },
      {
        id: "frase_preco",
        tipo: "texto",
        rotulo: "A última vez que alguém perguntou quanto custa, o que saiu da sua boca?",
        consumo: "icp",
        obrigatorio: true,
        minChars: 12,
        maxChars: 280,
        placeholder: "Tenho que ver e te falo.",
      },
      {
        id: "frase_sozinho",
        tipo: "texto",
        rotulo: "Por que você não quer funcionário — em uma frase sua, não da live.",
        consumo: "icp",
        obrigatorio: true,
        minChars: 12,
        maxChars: 280,
        placeholder: "Não aguento folha. Prefiro ganhar menos.",
      },
    ],
  },
];

export const TODOS_CAMPOS: CampoDiagnostico[] = BLOCOS.flatMap((b) => b.campos);

/** Todos os campo_id aceitos no payload (inclui a grade de meses e a flag placar_nao_sei). */
export function chavesPermitidas(): Set<string> {
  const chaves = new Set(TODOS_CAMPOS.map((c) => c.id));
  for (let n = 1; n <= NUM_MESES_PLACAR; n++) {
    for (const parte of PARCELAS_MES) chaves.add(chaveMes(n, parte));
    chaves.add(chaveMes(n, "fonte"));
    chaves.add(chaveMes(n, "ref"));
  }
  chaves.add("placar_nao_sei");
  return chaves;
}

export const TEXTO_ABERTURA =
  "Isso não é prova e não vai para a quarta. É o número de onde você parte. O Flávio e o Anjo usam este placar o ano inteiro. Leva uns doze minutos. Pode salvar e voltar.";

export const TEXTO_ENVIADO = "Fechado. Quarta você traz o extrato. Não precisa caprichar o que já escreveu aqui.";
