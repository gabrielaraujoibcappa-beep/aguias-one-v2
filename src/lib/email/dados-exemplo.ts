import {
  DadosBoasVindas,
  DadosModuloLiberado,
  DadosCheckinAprovado,
  DadosCheckinAjuste,
  DadosResgateSemafaro,
  DadosFaturamentoAuditoria,
  DadosLembreteCall,
  DadosStatusAcesso,
  gerarEmailBoasVindas,
  gerarEmailModuloLiberado,
  gerarEmailCheckinAprovado,
  gerarEmailCheckinAjuste,
  gerarEmailResgateSemafaro,
  gerarEmailFaturamentoAuditoria,
  gerarEmailLembreteCall,
  gerarEmailStatusAcesso,
  ResultadoEmail,
} from "./templates";

export interface TemplateInfo {
  id: string;
  nome: string;
  categoria: "onboarding" | "pedagogico" | "auditoria" | "engajamento" | "financeiro" | "administrativo";
  descricao: string;
  renderizar: () => ResultadoEmail;
}

export const TEMPLATES_CATALOGO: TemplateInfo[] = [
  {
    id: "boas_vindas",
    nome: "1. Boas-vindas & Credenciais de Acesso",
    categoria: "onboarding",
    descricao: "Enviado no momento da matrícula com login, senha inicial gerada e primeiros passos.",
    renderizar: () =>
      gerarEmailBoasVindas({
        nome: "Dr. Roberto Silva",
        email: "roberto.silva@pericia.com.br",
        senhaInicial: "Aguia@2026",
        turmaNome: "Águias ONE — Turma 2026.1",
        linkLogin: "http://localhost:3000/login",
        whatsappConcierge: "(11) 97777-1111",
      }),
  },
  {
    id: "modulo_liberado",
    nome: "2. Módulo Semanal Liberado",
    categoria: "pedagogico",
    descricao: "Enviado quando o Anjo ou Concierge libera um novo módulo para a turma.",
    renderizar: () =>
      gerarEmailModuloLiberado({
        nome: "Dr. Roberto Silva",
        moduloNumero: 2,
        moduloTitulo: "Agenda, Rotina e Alta Performance do Perito",
        disciplinaRef: "Rotina & Produtividade",
        descricao: "Aprenda a blindar sua agenda semanal, separar blocos de diligências judiciais e acelerar a redação de laudos técnicos.",
        itensRoteiro: [
          "Definir blocos de tempo para petições e análise pericial",
          "Configurar calendário sincronizado e alertas de prazos",
          "Submeter print do calendário preenchido e checklist de rotina",
        ],
        linkCheckin: "http://localhost:3000/checkin/mod-2",
        prazoSugerido: "Terça-feira, às 23:59",
      }),
  },
  {
    id: "checkin_aprovado",
    nome: "3. Check-in Aprovado (Parabéns)",
    categoria: "auditoria",
    descricao: "Enviado após a auditoria do Anjo/Mentor homologar a entrega do módulo.",
    renderizar: () =>
      gerarEmailCheckinAprovado({
        nome: "Dr. Roberto Silva",
        moduloNumero: 1,
        moduloTitulo: "Árvore de Pastas no Google Drive & Nomenclatura",
        avaliadorNome: "Ana Carolina (Anjo)",
        parecerTexto: "Excelente organização, Dr. Roberto! A estrutura de pastas por número de processo e cliente parceiro ficou exatamente dentro do método. Parabéns pela disciplina!",
        proximoModuloNumero: 2,
        linkPainel: "http://localhost:3000/dashboard",
      }),
  },
  {
    id: "checkin_ajuste",
    nome: "4. Ajuste Solicitado no Check-in",
    categoria: "auditoria",
    descricao: "Enviado quando a auditoria identifica inconsistências ou faltam evidências na entrega.",
    renderizar: () =>
      gerarEmailCheckinAjuste({
        nome: "Dr. Roberto Silva",
        moduloNumero: 3,
        moduloTitulo: "Catálogo de Serviços Periciais & Precificação",
        avaliadorNome: "Prof. Edilson Aguiais (Mentor)",
        parecerTexto: "Dr. Roberto, sua tabela de honorários precisa de um piso mínimo para assistências técnicas complexas. Revise o multiplicador de horas na aba de cálculos periciais e reenvie a planilha.",
        linkRevisao: "http://localhost:3000/checkin/mod-3",
      }),
  },
  {
    id: "resgate_semafaro",
    nome: "5. Alerta de Engajamento & Resgate (Semáforo)",
    categoria: "engajamento",
    descricao: "Disparado para peritos sem entrega há mais de 8 ou 14 dias pelo Concierge.",
    renderizar: () =>
      gerarEmailResgateSemafaro({
        nome: "Dr. Roberto Silva",
        diasSemEntrega: 16,
        statusSemaforo: "vermelho",
        ultimoModuloConcluido: "Módulo 2",
        whatsappConcierge: "5511977771111",
        linkPainel: "http://localhost:3000/dashboard",
      }),
  },
  {
    id: "faturamento_auditoria",
    nome: "6. Homologação de Faturamento",
    categoria: "financeiro",
    descricao: "Notifica o perito sobre a homologação de honorários declarados e comprovantes.",
    renderizar: () =>
      gerarEmailFaturamentoAuditoria({
        nome: "Dr. Roberto Silva",
        mesReferencia: "Março de 2026",
        valorBruto: 45000,
        statusAuditoria: "aprovado",
        parecerAuditoria: "Honorários periciais comprovados via notas fiscais e alvarás judiciais anexados no arquivo .ZIP.",
        linkFaturamento: "http://localhost:3000/faturamento",
      }),
  },
  {
    id: "lembrete_call",
    nome: "7. Lembrete do Encontro Semanal de Quarta",
    categoria: "pedagogico",
    descricao: "Lembrete automático enviado no dia do encontro ao vivo às 18:15.",
    renderizar: () =>
      gerarEmailLembreteCall({
        nome: "Dr. Roberto Silva",
        dataCallExtenso: "Hoje, Quarta-feira (16/09)",
        horario: "18:15 às 19:45 (Horário de Brasília)",
        linkEncontro: "https://meet.google.com/agu-ias-one",
        pautaPrincipal: "Alinhamento de Propostas Periciais Irrecusáveis, Estratégia de Captação e Análise de Casos Reais.",
        turmaNome: "Turma 2026.1",
      }),
  },
  {
    id: "status_acesso",
    nome: "8. Aviso de Acesso (Bloqueio / Desbloqueio)",
    categoria: "administrativo",
    descricao: "Comunicação oficial em caso de suspensão administrativa ou reativação de acesso.",
    renderizar: () =>
      gerarEmailStatusAcesso({
        nome: "Dr. Roberto Silva",
        acao: "bloqueado",
        motivo: "Pendência documental na ficha cadastral de matrícula",
        observacoes: "Por favor encaminhe o comprovante de registro profissional pericial atualizado.",
        responsavelNome: "Coordenação UniBCAPPA",
        linkContato: "https://wa.me/5511977771111",
      }),
  },
];

export function obterTemplatePorId(id: string): TemplateInfo | undefined {
  return TEMPLATES_CATALOGO.find((t) => t.id === id);
}
