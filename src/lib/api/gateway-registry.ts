/**
 * Registro central do Gateway de API (ÁGUIAS ONE v2).
 *
 * Fonte única da verdade sobre todas as funções/rotas do sistema.
 * O gateway (`/api/gateway`) usa este registro para descoberta (GET)
 * e despacho interno (POST). Cada rota continua existindo e continua
 * autorizando com `exigirSessao` — o gateway não afrouxa permissão,
 * só centraliza autenticação, log, rate-limit e envelope de resposta.
 */

export type MetodoGateway = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OperacaoGateway {
  /** Nome canônico usado no POST /api/gateway, ex: "alunos.listar" */
  operacao: string;
  metodo: MetodoGateway;
  /** Rota com placeholders :param, ex: "/api/alunos/:id" */
  rota: string;
  descricao: string;
  /**
   * false = não despachável via gateway (ex: cron com CRON_SECRET,
   * que deve ser chamado direto com o segredo).
   */
  viaGateway: boolean;
}

export const OPERACOES_GATEWAY: OperacaoGateway[] = [
  { operacao: "auth.perfil", metodo: "GET", rota: "/api/auth/me", descricao: "Perfil do usuário autenticado", viaGateway: true },
  { operacao: "admin.usuarios.criar", metodo: "POST", rota: "/api/admin/usuarios", descricao: "Criação centralizada de usuários", viaGateway: true },
  { operacao: "admin.usuarios.resetSenha", metodo: "POST", rota: "/api/admin/usuarios/reset-senha", descricao: "Reset de senha pela equipe", viaGateway: true },
  { operacao: "alunos.listar", metodo: "GET", rota: "/api/alunos", descricao: "Lista peritos com matrícula e turma", viaGateway: true },
  { operacao: "alunos.criar", metodo: "POST", rota: "/api/alunos", descricao: "Provisiona aluno (encaminha p/ admin/usuarios)", viaGateway: true },
  { operacao: "alunos.atualizar", metodo: "PATCH", rota: "/api/alunos/:id", descricao: "Atualiza dados do aluno", viaGateway: true },
  { operacao: "alunos.remover", metodo: "DELETE", rota: "/api/alunos/:id", descricao: "Remove/desativa aluno", viaGateway: true },
  { operacao: "turmas.listar", metodo: "GET", rota: "/api/turmas", descricao: "Lista turmas/ciclos", viaGateway: true },
  { operacao: "turmas.criar", metodo: "POST", rota: "/api/turmas", descricao: "Cria turma/ciclo", viaGateway: true },
  { operacao: "matriculas.meta.atualizar", metodo: "PUT", rota: "/api/matriculas/:id/meta", descricao: "Atualiza meta de faturamento da matrícula", viaGateway: true },
  { operacao: "modulos.listar", metodo: "GET", rota: "/api/modulos", descricao: "Lista os 10 módulos com liberação", viaGateway: true },
  { operacao: "modulos.liberar", metodo: "POST", rota: "/api/modulos/liberar", descricao: "Abre/bloqueia módulo pelo Anjo", viaGateway: true },
  { operacao: "canais.listar", metodo: "GET", rota: "/api/canais", descricao: "Lista os 7 canais de captação", viaGateway: true },
  { operacao: "canais.criar", metodo: "POST", rota: "/api/canais", descricao: "Ativa/atualiza canal de captação", viaGateway: true },
  { operacao: "chamadas.listar", metodo: "GET", rota: "/api/chamadas", descricao: "Lista encontros/chamadas", viaGateway: true },
  { operacao: "chamadas.criar", metodo: "POST", rota: "/api/chamadas", descricao: "Cria encontro/chamada", viaGateway: true },
  { operacao: "chamadas.presencas.atualizar", metodo: "PUT", rota: "/api/chamadas/:encontroId/presencas", descricao: "Registra presenças do encontro", viaGateway: true },
  { operacao: "checkins.listar", metodo: "GET", rota: "/api/checkins", descricao: "Lista check-ins / fila de auditoria", viaGateway: true },
  { operacao: "checkins.criar", metodo: "POST", rota: "/api/checkins", descricao: "Submete check-in do mentorado", viaGateway: true },
  { operacao: "checkins.auditar", metodo: "PATCH", rota: "/api/checkins/:id/auditar", descricao: "Parecer da entrega (mentor/admin)", viaGateway: true },
  { operacao: "faturamentos.listar", metodo: "GET", rota: "/api/faturamentos", descricao: "Lista declarações de faturamento", viaGateway: true },
  { operacao: "faturamentos.criar", metodo: "POST", rota: "/api/faturamentos", descricao: "Declara faturamento + ZIP", viaGateway: true },
  { operacao: "faturamentos.atualizar", metodo: "PATCH", rota: "/api/faturamentos/:id", descricao: "Atualiza declaração", viaGateway: true },
  { operacao: "faturamentos.remover", metodo: "DELETE", rota: "/api/faturamentos/:id", descricao: "Remove declaração", viaGateway: true },
  { operacao: "faturamentos.auditar", metodo: "PATCH", rota: "/api/faturamentos/:id/auditar", descricao: "Auditoria de comprovantes/ZIP", viaGateway: true },
  { operacao: "diagnostico.obter", metodo: "GET", rota: "/api/diagnostico", descricao: "Diagnóstico da própria matrícula", viaGateway: true },
  { operacao: "diagnostico.atualizar", metodo: "PUT", rota: "/api/diagnostico", descricao: "Atualiza rascunho do diagnóstico", viaGateway: true },
  { operacao: "diagnostico.obterPorMatricula", metodo: "GET", rota: "/api/diagnostico/:matricula", descricao: "Diagnóstico por matrícula (equipe)", viaGateway: true },
  { operacao: "diagnosticos.listar", metodo: "GET", rota: "/api/diagnosticos", descricao: "Lista diagnósticos para painéis", viaGateway: true },
  { operacao: "diagnostico.enviar", metodo: "POST", rota: "/api/diagnostico/enviar", descricao: "Envia diagnóstico para análise", viaGateway: true },
  { operacao: "diagnostico.corrigir", metodo: "POST", rota: "/api/diagnostico/corrigir", descricao: "Solicita/aplica correção", viaGateway: true },
  { operacao: "diagnostico.importar", metodo: "POST", rota: "/api/diagnostico/import", descricao: "Importa diagnóstico via ZIP", viaGateway: true },
  { operacao: "diagnostico.exportar", metodo: "GET", rota: "/api/diagnostico/export", descricao: "Exporta dossiê do diagnóstico", viaGateway: true },
  { operacao: "diagnostico.comprovantes.listar", metodo: "GET", rota: "/api/diagnostico/comprovantes", descricao: "Lista comprovantes do diagnóstico", viaGateway: true },
  { operacao: "diagnostico.comprovantes.adicionar", metodo: "POST", rota: "/api/diagnostico/comprovantes", descricao: "Anexa comprovante", viaGateway: true },
  { operacao: "diagnostico.comprovantes.remover", metodo: "DELETE", rota: "/api/diagnostico/comprovantes", descricao: "Remove comprovante", viaGateway: true },
  { operacao: "semaforo.painel", metodo: "GET", rota: "/api/semaforo", descricao: "Semáforo da turma em tempo real", viaGateway: true },
  { operacao: "semaforo.historico", metodo: "GET", rota: "/api/semaforo/historico", descricao: "Histórico do semáforo", viaGateway: true },
  { operacao: "anjo.mes6", metodo: "GET", rota: "/api/anjo/mes6", descricao: "Janela do 6º mês (sessão obrigatória)", viaGateway: true },
  { operacao: "anjo.plano.obter", metodo: "GET", rota: "/api/anjo/plano/:matricula", descricao: "Plano do mentorado", viaGateway: true },
  { operacao: "anjo.plano.atualizar", metodo: "PUT", rota: "/api/anjo/plano/:matricula", descricao: "Atualiza plano do mentorado", viaGateway: true },
  { operacao: "anjo.notas.adicionar", metodo: "POST", rota: "/api/anjo/notas/:matricula", descricao: "Registra nota do Anjo", viaGateway: true },
  { operacao: "resgate.painel", metodo: "GET", rota: "/api/resgate", descricao: "Painel de resgate (Adelayne)", viaGateway: true },
  { operacao: "resgate.contatos.listar", metodo: "GET", rota: "/api/resgate/contatos", descricao: "Lista contatos em resgate", viaGateway: true },
  { operacao: "resgate.contatos.adicionar", metodo: "POST", rota: "/api/resgate/contatos", descricao: "Registra contato de resgate", viaGateway: true },
  { operacao: "materiais.listar", metodo: "GET", rota: "/api/materiais", descricao: "Lista materiais de apoio", viaGateway: true },
  { operacao: "materiais.criar", metodo: "POST", rota: "/api/materiais", descricao: "Publica material", viaGateway: true },
  { operacao: "materiais.remover", metodo: "DELETE", rota: "/api/materiais", descricao: "Remove material", viaGateway: true },
  { operacao: "bloqueios.listar", metodo: "GET", rota: "/api/bloqueios", descricao: "Bloqueios vigentes + histórico", viaGateway: true },
  { operacao: "bloqueios.criar", metodo: "POST", rota: "/api/bloqueios", descricao: "Bloqueia/desbloqueia acesso", viaGateway: true },
  { operacao: "arquivos.obter", metodo: "GET", rota: "/api/arquivos", descricao: "URL assinada de arquivo no Storage", viaGateway: true },
  { operacao: "upload.enviar", metodo: "POST", rota: "/api/upload", descricao: "Upload seguro no Supabase Storage", viaGateway: true },
  { operacao: "usuarios.senha.atualizar", metodo: "POST", rota: "/api/usuarios/senha", descricao: "Troca de senha (temporária/definitiva)", viaGateway: true },
  { operacao: "icp.frases", metodo: "GET", rota: "/api/icp/frases", descricao: "Frases do ICP", viaGateway: true },
  { operacao: "icp.agregado", metodo: "GET", rota: "/api/icp/agregado", descricao: "Agregado do ICP por turma", viaGateway: true },
  { operacao: "auditoria.exportar", metodo: "GET", rota: "/api/auditoria/export", descricao: "Exporta auditoria (LGPD)", viaGateway: true },
  { operacao: "emails.preview", metodo: "GET", rota: "/api/emails/preview", descricao: "Prévia do e-mail/disparo", viaGateway: true },
  { operacao: "emails.enviar", metodo: "POST", rota: "/api/emails/enviar", descricao: "Dispara e-mail", viaGateway: true },
  { operacao: "chaves.listar", metodo: "GET", rota: "/api/chaves", descricao: "Lista chaves de API (sem o segredo)", viaGateway: true },
  { operacao: "chaves.gerar", metodo: "POST", rota: "/api/chaves", descricao: "Gera chave (segredo exibido 1x)", viaGateway: true },
  { operacao: "chaves.revogar", metodo: "DELETE", rota: "/api/chaves/:id", descricao: "Revoga chave de API", viaGateway: true },
  {
    operacao: "cron.diario",
    metodo: "GET",
    rota: "/api/cron/diario",
    descricao: "Job diário (Vercel Cron). NÃO vai pelo gateway: chamar direto com Authorization: Bearer CRON_SECRET.",
    viaGateway: false,
  },
];

export function buscarOperacao(nome: string): OperacaoGateway | undefined {
  return OPERACOES_GATEWAY.find((o) => o.operacao === nome);
}

/** Substitui :params na rota. Lança erro se faltar parâmetro. */
export function montarRota(rota: string, params: Record<string, string> = {}): string {
  return rota.replace(/:([A-Za-z_]+)/g, (_m, nome: string) => {
    const valor = params[nome];
    if (!valor) throw new Error(`Parâmetro de rota ausente: ${nome}`);
    return encodeURIComponent(valor);
  });
}

/** Só operações despacháveis via gateway. */
export function operacoesDespachaveis(): OperacaoGateway[] {
  return OPERACOES_GATEWAY.filter((o) => o.viaGateway);
}
