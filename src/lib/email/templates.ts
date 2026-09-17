import { renderizarLayoutEmail } from "./layout";
import { URL_SISTEMA } from "@/lib/url-sistema";

export interface ResultadoEmail {
  tipo: string;
  assunto: string;
  preheader: string;
  html: string;
  textoPuro: string;
}

// ---------------------------------------------------------------------------
// 1. E-MAIL DE BOAS-VINDAS & ACESSO À PLATAFORMA
// ---------------------------------------------------------------------------
export interface DadosBoasVindas {
  nome: string;
  email: string;
  /** Quando ausente, o e-mail não traz senha: ela é entregue pelo Concierge no WhatsApp. */
  senhaInicial?: string;
  turmaNome?: string;
  linkLogin?: string;
  whatsappConcierge?: string;
}

export function gerarEmailBoasVindas(dados: DadosBoasVindas): ResultadoEmail {
  const {
    nome,
    email,
    senhaInicial,
    turmaNome = "Águias ONE — Turma 2026.1",
    linkLogin = `${URL_SISTEMA}/login`,
    whatsappConcierge = "(11) 97777-1111",
  } = dados;

  const assunto = `🦅 Bem-vindo ao ÁGUIAS ONE — Seus dados de acesso`;
  const preheader = `Seu acesso à plataforma da Mentoria ÁGUIAS ONE está liberado. Confira suas credenciais e primeiros passos.`;

  const corpoHtml = `
    <p>Olá, <strong>${nome}</strong>!</p>
    <p>É uma honra receber você na <strong>Mentoria ÁGUIAS ONE</strong>, o programa de aceleração e escala pericial de elite da UniBCAPPA.</p>
    <p>Sua matrícula na <strong>${turmaNome}</strong> foi concluída com sucesso e seu acesso individual ao sistema de acompanhamento e checagem de entregas já está pronto para uso.</p>

    <div style="margin: 24px 0; padding: 20px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
      <div style="font-size: 13px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">
        🔑 Suas Credenciais de Acesso:
      </div>
      <div style="font-size: 14px; margin-bottom: 8px; color: #1E293B;">
        <strong>E-mail:</strong> <span style="font-family: monospace; background: #EEF2F6; padding: 2px 6px; border-radius: 4px;">${email}</span>
      </div>
      <div style="font-size: 14px; color: #1E293B;">
        <strong>Senha:</strong> ${
          senhaInicial
            ? `<span style="font-family: monospace; background: #EEF2F6; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #0052FF;">${senhaInicial}</span>`
            : "enviada pelo Concierge no seu WhatsApp, por segurança."
        }
      </div>
    </div>

    <p style="font-size: 14px; color: #64748B;">
      * Troque a senha depois do primeiro acesso, nas configurações do perfil.
    </p>
  `;

  const caixaDestaqueHtml = `
    <strong style="color: #0F172A; display: block; margin-bottom: 6px;">💡 Próximos Passos Importantes:</strong>
    <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 22px;">
      <li>Faça login na plataforma e complete seu perfil pericial.</li>
      <li>Acesse o <strong>Módulo 1: Árvore de Pastas no Google Drive</strong> e confira o roteiro prático.</li>
      <li>Salve na sua agenda os encontros ao vivo de quarta-feira (18:15 às 19:45).</li>
      <li>Em caso de qualquer dúvida, nosso Concierge Flávio Lopes está à disposição no WhatsApp <strong>${whatsappConcierge}</strong>.</li>
    </ol>
  `;

  const html = renderizarLayoutEmail({
    preheader,
    tituloBadge: "Acesso Liberado",
    titulo: "Bem-vindo ao ÁGUIAS ONE!",
    subtitulo: `Sua vaga na ${turmaNome} está confirmada. Comece agora sua jornada rumo aos R$ 100k+ na perícia.`,
    corpoHtml,
    caixaDestaqueHtml,
    ctaPrincipal: {
      rotulo: "Acessar Plataforma ÁGUIAS ONE",
      url: linkLogin,
    },
    tom: "padrao",
  });

  const textoPuro = `
ÁGUIAS ONE — Mentoria Pericial de Elite (IBCAPPA)
Bem-vindo ao ÁGUIAS ONE!

Olá, ${nome}!
Sua matrícula na ${turmaNome} foi concluída com sucesso.

Seus dados de acesso:
E-mail: ${email}
Senha: ${senhaInicial || "enviada pelo Concierge no seu WhatsApp, por segurança."}
Link de acesso: ${linkLogin}

Encontro semanal ao vivo: Quartas-feiras das 18:15 às 19:45.
Suporte Concierge: ${whatsappConcierge}
  `.trim();

  return { tipo: "boas_vindas", assunto, preheader, html, textoPuro };
}

// ---------------------------------------------------------------------------
// 2. E-MAIL DE MÓDULO LIBERADO
// ---------------------------------------------------------------------------
export interface DadosModuloLiberado {
  nome: string;
  moduloNumero: number;
  moduloTitulo: string;
  disciplinaRef?: string;
  descricao?: string;
  itensRoteiro?: string[];
  linkCheckin?: string;
  prazoSugerido?: string;
}

export function gerarEmailModuloLiberado(dados: DadosModuloLiberado): ResultadoEmail {
  const {
    nome,
    moduloNumero,
    moduloTitulo,
    disciplinaRef = "Execução Pericial",
    descricao = "Confira o roteiro da semana, assista às aulas de alinhamento e submeta as evidências da entrega no prazo.",
    itensRoteiro = [],
    linkCheckin = `${URL_SISTEMA}/checkin/mod-${dados.moduloNumero}`,
    prazoSugerido = "Próxima terça-feira, às 23:59",
  } = dados;

  const assunto = `🚀 Módulo ${moduloNumero} Liberado: ${moduloTitulo} — ÁGUIAS ONE`;
  const preheader = `O Módulo ${moduloNumero} da sua jornada foi liberado pela coordenação. Confira as tarefas e o roteiro de entrega.`;

  const listaItensHtml = itensRoteiro.length > 0
    ? `
      <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 22px;">
        ${itensRoteiro.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    `
    : "";

  const corpoHtml = `
    <p>Olá, <strong>${nome}</strong>!</p>
    <p>O <strong>Módulo ${moduloNumero}</strong> da Mentoria ÁGUIAS ONE já está liberado para o seu ciclo:</p>

    <div style="margin: 20px 0; padding: 20px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
      <div style="font-size: 12px; font-weight: 700; color: #0052FF; text-transform: uppercase; letter-spacing: 0.5px;">
        ${disciplinaRef}
      </div>
      <div style="font-size: 18px; font-weight: 800; color: #0F172A; margin: 4px 0 8px 0;">
        Módulo ${moduloNumero}: ${moduloTitulo}
      </div>
      <p style="margin: 0; font-size: 14px; color: #475569; line-height: 22px;">
        ${descricao}
      </p>
      ${listaItensHtml}
    </div>
  `;

  const caixaDestaqueHtml = `
    <strong style="color: #0F172A;">⏰ Prazo Recomendado para Submissão:</strong>
    <p style="margin: 4px 0 0 0; font-size: 14px; color: #334155;">
      Submeta seu check-in até <strong>${prazoSugerido}</strong> para que nosso Anjo e Mentores auditem sua entrega e tirem suas dúvidas na call de quarta-feira.
    </p>
  `;

  const html = renderizarLayoutEmail({
    preheader,
    tituloBadge: `Ciclo Ativo · Módulo ${moduloNumero}`,
    titulo: `Módulo ${moduloNumero} Liberado!`,
    subtitulo: moduloTitulo,
    corpoHtml,
    caixaDestaqueHtml,
    ctaPrincipal: {
      rotulo: `Acessar Módulo ${moduloNumero} & Check-in`,
      url: linkCheckin,
    },
    tom: "padrao",
  });

  const textoPuro = `
ÁGUIAS ONE — Módulo ${moduloNumero} Liberado: ${moduloTitulo}
Olá, ${nome}!

O Módulo ${moduloNumero} (${moduloTitulo}) está liberado na plataforma.
Prazo sugerido de entrega: ${prazoSugerido}.

Acesse e submeta seu check-in: ${linkCheckin}
  `.trim();

  return { tipo: "modulo_liberado", assunto, preheader, html, textoPuro };
}

// ---------------------------------------------------------------------------
// 3. E-MAIL DE CHECK-IN APROVADO
// ---------------------------------------------------------------------------
export interface DadosCheckinAprovado {
  nome: string;
  moduloNumero: number;
  moduloTitulo: string;
  avaliadorNome: string;
  parecerTexto?: string;
  proximoModuloNumero?: number;
  linkPainel?: string;
}

export function gerarEmailCheckinAprovado(dados: DadosCheckinAprovado): ResultadoEmail {
  const {
    nome,
    moduloNumero,
    moduloTitulo,
    avaliadorNome = "Ana Carolina (Anjo)",
    parecerTexto = "Parabéns pela execução! Estrutura impecável dentro do padrão ÁGUIAS ONE.",
    proximoModuloNumero = dados.moduloNumero + 1,
    linkPainel = `${URL_SISTEMA}/dashboard`,
  } = dados;

  const assunto = `✅ Check-in Aprovado: Módulo ${moduloNumero} — Parabéns, ${nome}!`;
  const preheader = `Sua entrega do Módulo ${moduloNumero} foi avaliada e homologada pela equipe de auditoria do ÁGUIAS ONE.`;

  const corpoHtml = `
    <p>Olá, <strong>${nome}</strong>!</p>
    <p>Temos uma excelente notícia: a auditoria da sua entrega do <strong>Módulo ${moduloNumero}: ${moduloTitulo}</strong> foi concluída com sucesso!</p>

    <div style="margin: 20px 0; padding: 20px; background-color: #ECFDF5; border-left: 4px solid #10B981; border-radius: 0 8px 8px 0;">
      <div style="font-size: 13px; font-weight: 700; color: #065F46; margin-bottom: 6px;">
        💬 Parecer da Auditoria (${avaliadorNome}):
      </div>
      <p style="margin: 0; font-size: 15px; color: #047857; line-height: 22px; font-style: italic;">
        "${parecerTexto}"
      </p>
    </div>

    <p>Seu progresso na mentoria foi atualizado no Semáforo da Turma (status: <strong>Verde / Em Dia</strong>). Mantenha o ritmo forte para o próximo marco!</p>
  `;

  const html = renderizarLayoutEmail({
    preheader,
    tituloBadge: "Entrega Homologada",
    titulo: `Módulo ${moduloNumero} Aprovado!`,
    subtitulo: `Excelente trabalho na consolidação do ${moduloTitulo}.`,
    corpoHtml,
    ctaPrincipal: {
      rotulo: proximoModuloNumero <= 10 ? `Avançar para o Módulo ${proximoModuloNumero}` : "Ver Meu Dashboard",
      url: linkPainel,
    },
    tom: "sucesso",
  });

  const textoPuro = `
ÁGUIAS ONE — Check-in Aprovado!
Parabéns, ${nome}!

Sua entrega do Módulo ${moduloNumero} (${moduloTitulo}) foi aprovada.
Avaliador: ${avaliadorNome}
Parecer: "${parecerTexto}"

Acesse o painel: ${linkPainel}
  `.trim();

  return { tipo: "checkin_aprovado", assunto, preheader, html, textoPuro };
}

// ---------------------------------------------------------------------------
// 4. E-MAIL DE AJUSTE SOLICITADO NO CHECK-IN
// ---------------------------------------------------------------------------
export interface DadosCheckinAjuste {
  nome: string;
  moduloNumero: number;
  moduloTitulo: string;
  avaliadorNome: string;
  parecerTexto: string;
  linkRevisao?: string;
}

export function gerarEmailCheckinAjuste(dados: DadosCheckinAjuste): ResultadoEmail {
  const {
    nome,
    moduloNumero,
    moduloTitulo,
    avaliadorNome = "Ana Carolina (Anjo)",
    parecerTexto,
    linkRevisao = `${URL_SISTEMA}/checkin/mod-${dados.moduloNumero}`,
  } = dados;

  const assunto = `⚠️ Ajuste Solicitado no Check-in: Módulo ${moduloNumero} — ÁGUIAS ONE`;
  const preheader = `A equipe de auditoria analisou sua entrega do Módulo ${moduloNumero} e indicou alguns pontos para aprimoramento.`;

  const corpoHtml = `
    <p>Olá, <strong>${nome}</strong>!</p>
    <p>Nossa equipe de auditoria revisou as evidências do seu <strong>Módulo ${moduloNumero}: ${moduloTitulo}</strong> e identificou ajustes necessários para garantir o padrão de excelência pericial do ÁGUIAS ONE.</p>

    <div style="margin: 24px 0; padding: 20px; background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 0 8px 8px 0; border-top: 1px solid #FEF3C7; border-right: 1px solid #FEF3C7; border-bottom: 1px solid #FEF3C7;">
      <div style="font-size: 13px; font-weight: 700; color: #92400E; margin-bottom: 8px;">
        📝 Orientações de Ajuste (${avaliadorNome}):
      </div>
      <p style="margin: 0; font-size: 15px; color: #78350F; line-height: 24px;">
        ${parecerTexto}
      </p>
    </div>

    <p>Não se preocupe: ajustes fazem parte da evolução e da blindagem do seu negócio. Você pode fazer as alterações solicitadas e reenviar seu check-in diretamente pelo botão abaixo.</p>
  `;

  const caixaDestaqueHtml = `
    <strong style="color: #0F172A;">💡 Dica de Mentoria:</strong>
    <p style="margin: 4px 0 0 0; font-size: 14px; color: #475569;">
      Se preferir tirar dúvidas ao vivo sobre este ajuste com o Prof. Edilson e o time, traga seu caso para o nosso encontro de quarta-feira às 18:15.
    </p>
  `;

  const html = renderizarLayoutEmail({
    preheader,
    tituloBadge: "Ajuste Recomendado",
    titulo: "Ajuste Solicitado na Entrega",
    subtitulo: `Módulo ${moduloNumero}: ${moduloTitulo}`,
    corpoHtml,
    caixaDestaqueHtml,
    ctaPrincipal: {
      rotulo: "Revisar e Reenviar Check-in",
      url: linkRevisao,
    },
    tom: "alerta",
  });

  const textoPuro = `
ÁGUIAS ONE — Ajuste Solicitado no Módulo ${moduloNumero}
Olá, ${nome}!

Identificamos pontos para ajuste no Módulo ${moduloNumero} (${moduloTitulo}).
Avaliador: ${avaliadorNome}
Orientações:
${parecerTexto}

Reenvie seu check-in em: ${linkRevisao}
  `.trim();

  return { tipo: "checkin_ajuste", assunto, preheader, html, textoPuro };
}

// ---------------------------------------------------------------------------
// 5. E-MAIL DE RESGATE / SEMÁFORO (ALERTA DE ENGAJAMENTO)
// ---------------------------------------------------------------------------
export interface DadosResgateSemafaro {
  nome: string;
  diasSemEntrega: number;
  statusSemaforo: "amarelo" | "vermelho";
  ultimoModuloConcluido?: string;
  whatsappConcierge?: string;
  linkPainel?: string;
}

export function gerarEmailResgateSemafaro(dados: DadosResgateSemafaro): ResultadoEmail {
  const {
    nome,
    diasSemEntrega,
    statusSemaforo,
    ultimoModuloConcluido = "Módulo 1",
    whatsappConcierge = "5511977771111",
    linkPainel = `${URL_SISTEMA}/dashboard`,
  } = dados;

  const isVermelho = statusSemaforo === "vermelho";
  const assunto = `🦅 ${nome}, como podemos te apoiar no ÁGUIAS ONE esta semana?`;
  const preheader = `Sentimos sua falta nas últimas entregas. Estamos à disposição para destravar sua jornada pericial.`;

  const linkWhatsapp = `https://wa.me/${whatsappConcierge}?text=${encodeURIComponent(`Olá, Flávio! Sou o(a) ${nome} do ÁGUIAS ONE e preciso de ajuda para destravar minha jornada.`)}`;

  const corpoHtml = `
    <p>Olá, <strong>${nome}</strong>!</p>
    <p>Aqui é o <strong>Flávio Lopes</strong>, do time de Concierge do ÁGUIAS ONE.</p>
    <p>Notei no nosso painel de acompanhamento que já fazem <strong>${diasSemEntrega} dias</strong> desde a sua última entrega registrada (último marco: <em>${ultimoModuloConcluido}</em>).</p>
    <p>Sabemos que a rotina de perícias, prazos judiciais e compromissos profissionais pode ficar intensa. Nosso objetivo não é cobrar burocracia, mas sim garantir que você não perca a tração e alcance a sua meta de faturamento e escala.</p>

    <div style="margin: 24px 0; padding: 20px; background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 0 8px 8px 0;">
      <strong style="color: #991B1B; display: block; margin-bottom: 6px;">Qual foi o principal obstáculo?</strong>
      <ul style="margin: 0; padding-left: 20px; color: #7F1D1D; font-size: 14px; line-height: 22px;">
        <li>Travou na organização das pastas ou nomenclatura do Drive?</li>
        <li>Dificuldade na ativação dos canais ou captação de novos clientes?</li>
        <li>Falta de tempo na semana para concluir o roteiro prático?</li>
      </ul>
    </div>

    <p>Qualquer que seja a sua trava, eu e os mentores estamos 100% disponíveis para te apoiar e colocar seu plano de volta aos trilhos.</p>
  `;

  const html = renderizarLayoutEmail({
    preheader,
    tituloBadge: isVermelho ? "Suporte Prioritário" : "Atenção de Ritmo",
    titulo: "Sentimos sua falta!",
    subtitulo: `Vamos destravar seus próximos passos juntos no ÁGUIAS ONE.`,
    corpoHtml,
    ctaPrincipal: {
      rotulo: "Falar Diretamente com o Concierge no WhatsApp",
      url: linkWhatsapp,
    },
    ctaSecundario: {
      rotulo: "Ou acesse a plataforma para retomar suas entregas",
      url: linkPainel,
    },
    tom: isVermelho ? "urgente" : "alerta",
  });

  const textoPuro = `
ÁGUIAS ONE — Apoio Concierge
Olá, ${nome}!

Aqui é o Flávio Lopes. Notei que você está há ${diasSemEntrega} dias sem submeter check-in.
Como podemos te ajudar a destravar esta semana?

Fale comigo no WhatsApp: https://wa.me/${whatsappConcierge}
Ou acesse seu painel: ${linkPainel}
  `.trim();

  return { tipo: "resgate_semafaro", assunto, preheader, html, textoPuro };
}

// ---------------------------------------------------------------------------
// 6. E-MAIL DE AUDITORIA DE FATURAMENTO
// ---------------------------------------------------------------------------
export interface DadosFaturamentoAuditoria {
  nome: string;
  mesReferencia: string; // "Março de 2026"
  valorBruto: number;
  statusAuditoria: "aprovado" | "ajuste_solicitado";
  parecerAuditoria?: string;
  linkFaturamento?: string;
}

export function gerarEmailFaturamentoAuditoria(dados: DadosFaturamentoAuditoria): ResultadoEmail {
  const {
    nome,
    mesReferencia,
    valorBruto,
    statusAuditoria,
    parecerAuditoria = "Comprovantes e valores verificados com sucesso.",
    linkFaturamento = `${URL_SISTEMA}/faturamento`,
  } = dados;

  const isAprovado = statusAuditoria === "aprovado";
  const valorFormatado = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorBruto);

  const assunto = isAprovado
    ? `💰 Faturamento Homologado: ${mesReferencia} (${valorFormatado}) — ÁGUIAS ONE`
    : `⚠️ Ajuste na Declaração de Faturamento: ${mesReferencia} — ÁGUIAS ONE`;

  const preheader = isAprovado
    ? `Sua declaração de faturamento de ${mesReferencia} (${valorFormatado}) foi homologada pela coordenação.`
    : `A equipe de auditoria analisou sua declaração de faturamento de ${mesReferencia} e solicita um ajuste nos comprovantes.`;

  const corpoHtml = `
    <p>Olá, <strong>${nome}</strong>!</p>
    <p>A auditoria da sua declaração de faturamento referente a <strong>${mesReferencia}</strong> foi concluída.</p>

    <div style="margin: 24px 0; padding: 20px; background-color: ${isAprovado ? "#ECFDF5" : "#FFFBEB"}; border-left: 4px solid ${isAprovado ? "#10B981" : "#F59E0B"}; border-radius: 0 8px 8px 0;">
      <div style="font-size: 12px; font-weight: 700; color: ${isAprovado ? "#065F46" : "#92400E"}; text-transform: uppercase;">
        Valor Declarado:
      </div>
      <div style="font-size: 24px; font-weight: 800; color: ${isAprovado ? "#047857" : "#B45309"}; margin: 4px 0 12px 0;">
        ${valorFormatado}
      </div>
      <div style="font-size: 13px; font-weight: 700; color: ${isAprovado ? "#065F46" : "#92400E"}; margin-bottom: 4px;">
        Parecer da Coordenação:
      </div>
      <p style="margin: 0; font-size: 14px; color: ${isAprovado ? "#065F46" : "#78350F"}; line-height: 22px;">
        "${parecerAuditoria}"
      </p>
    </div>

    ${
      isAprovado
        ? `<p>Este valor já foi somado ao seu indicador anual acumulado no painel da mentoria. Parabéns pelos resultados!</p>`
        : `<p>Por favor, acesse a aba de Faturamento para anexar novamente o pacote ZIP ou comprovante solicitado.</p>`
    }
  `;

  const html = renderizarLayoutEmail({
    preheader,
    tituloBadge: isAprovado ? "Faturamento Homologado" : "Ajuste de Comprovante",
    titulo: isAprovado ? "Faturamento Aprovado!" : "Ajuste na Declaração",
    subtitulo: `Mês de Referência: ${mesReferencia}`,
    corpoHtml,
    ctaPrincipal: {
      rotulo: "Ver Painel de Faturamento",
      url: linkFaturamento,
    },
    tom: isAprovado ? "sucesso" : "alerta",
  });

  const textoPuro = `
ÁGUIAS ONE — Auditoria de Faturamento
Mês: ${mesReferencia}
Valor: ${valorFormatado}
Status: ${isAprovado ? "Homologado / Aprovado" : "Ajuste Solicitado"}
Parecer: "${parecerAuditoria}"

Acesse: ${linkFaturamento}
  `.trim();

  return { tipo: "faturamento_auditoria", assunto, preheader, html, textoPuro };
}

// ---------------------------------------------------------------------------
// 7. E-MAIL DE LEMBRETE DA CALL SEMANAL DE QUARTA-FEIRA
// ---------------------------------------------------------------------------
export interface DadosLembreteCall {
  nome: string;
  dataCallExtenso: string; // "Hoje, 16 de Setembro"
  horario: string; // "18:15 às 19:45"
  linkEncontro: string;
  pautaPrincipal?: string;
  turmaNome?: string;
}

export function gerarEmailLembreteCall(dados: DadosLembreteCall): ResultadoEmail {
  const {
    nome,
    dataCallExtenso = "Hoje, Quarta-feira",
    horario = "18:15 às 19:45 (Horário de Brasília)",
    linkEncontro = "https://meet.google.com/agu-ias-one",
    pautaPrincipal = "Alinhamento prático de propostas comerciais periciais, dúvidas dos check-ins e auditoria ao vivo.",
    turmaNome = "Turma 2026.1",
  } = dados;

  const assunto = `📅 Hoje às 18:15: Encontro ao Vivo ÁGUIAS ONE (${turmaNome})`;
  const preheader = `Nosso encontro semanal ao vivo acontece hoje às 18:15. Traga suas dúvidas e casos reais de perícia.`;

  const corpoHtml = `
    <p>Olá, <strong>${nome}</strong>!</p>
    <p>Passando para lembrar que <strong>${dataCallExtenso}</strong> teremos nossa call semanal da mentoria.</p>

    <div style="margin: 24px 0; padding: 20px; background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding-bottom: 8px;">
            <strong>⏰ Horário:</strong> ${horario}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 8px;">
            <strong>📍 Plataforma:</strong> Google Meet / Transmissão Ao Vivo
          </td>
        </tr>
        <tr>
          <td>
            <strong>🎯 Pauta da Semana:</strong> ${pautaPrincipal}
          </td>
        </tr>
      </table>
    </div>

    <p>Participe com microfone e câmera a postos para interagir com o Prof. Edilson Aguiais, com nossos anjos e com os demais peritos da turma.</p>
  `;

  const html = renderizarLayoutEmail({
    preheader,
    tituloBadge: "Encontro Semanal",
    titulo: "Hoje temos Encontro ao Vivo!",
    subtitulo: `${dataCallExtenso} · ${horario}`,
    corpoHtml,
    ctaPrincipal: {
      rotulo: "Entrar na Sala Virtual do Encontro",
      url: linkEncontro,
    },
    tom: "padrao",
  });

  const textoPuro = `
ÁGUIAS ONE — Encontro Semanal ao Vivo
Olá, ${nome}!

Lembrete da nossa call:
Data: ${dataCallExtenso}
Horário: ${horario}
Pauta: ${pautaPrincipal}

Link de acesso: ${linkEncontro}
  `.trim();

  return { tipo: "lembrete_call", assunto, preheader, html, textoPuro };
}

// ---------------------------------------------------------------------------
// 8. E-MAIL DE STATUS DE ACESSO (BLOQUEIO / DESBLOQUEIO)
// ---------------------------------------------------------------------------
export interface DadosStatusAcesso {
  nome: string;
  acao: "bloqueado" | "desbloqueado";
  motivo?: string;
  observacoes?: string;
  responsavelNome?: string;
  linkContato?: string;
}

export function gerarEmailStatusAcesso(dados: DadosStatusAcesso): ResultadoEmail {
  const {
    nome,
    acao,
    motivo = "Pendência administrativa ou cadastral",
    observacoes = "Entre em contato com nossa equipe para regularizar sua situação.",
    responsavelNome = "Coordenação ÁGUIAS ONE",
    linkContato = "https://wa.me/5511977771111",
  } = dados;

  const isBloqueio = acao === "bloqueado";
  const assunto = isBloqueio
    ? `⚠️ Notificação de Acesso Suspenso — ÁGUIAS ONE`
    : `✅ Seu Acesso foi Reativado com Sucesso — ÁGUIAS ONE`;

  const preheader = isBloqueio
    ? `Seu acesso à plataforma ÁGUIAS ONE foi temporariamente suspenso pela coordenação.`
    : `Seu acesso à plataforma ÁGUIAS ONE foi restabelecido e você já pode voltar às aulas e check-ins.`;

  const corpoHtml = isBloqueio
    ? `
      <p>Olá, <strong>${nome}</strong>.</p>
      <p>Informamos que o seu acesso à plataforma da Mentoria ÁGUIAS ONE foi <strong>temporariamente suspenso</strong> pela coordenação.</p>

      <div style="margin: 20px 0; padding: 20px; background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 0 8px 8px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #991B1B; margin-bottom: 4px;">
          Motivo do Bloqueio:
        </div>
        <p style="margin: 0 0 10px 0; font-size: 15px; color: #7F1D1D; font-weight: 600;">
          ${motivo}
        </p>
        <div style="font-size: 13px; font-weight: 700; color: #991B1B; margin-bottom: 4px;">
          Observações (${responsavelNome}):
        </div>
        <p style="margin: 0; font-size: 14px; color: #7F1D1D; line-height: 20px;">
          ${observacoes}
        </p>
      </div>

      <p>Para restabelecer seu acesso, favor entrar em contato imediatamente com a nossa equipe de suporte.</p>
    `
    : `
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>Temos o prazer de informar que o seu acesso à plataforma ÁGUIAS ONE foi <strong>restabelecido com sucesso</strong> pela coordenação.</p>
      <p>Todas as suas funcionalidades, histórico de check-ins e visualização de aulas foram reativadas integralmente.</p>
    `;

  const html = renderizarLayoutEmail({
    preheader,
    tituloBadge: isBloqueio ? "Aviso Administrativo" : "Acesso Liberado",
    titulo: isBloqueio ? "Acesso Suspenso" : "Acesso Restabelecido!",
    subtitulo: isBloqueio ? "Regularização necessária" : "Seja bem-vindo de volta à plataforma.",
    corpoHtml,
    ctaPrincipal: isBloqueio
      ? {
          rotulo: "Falar com o Concierge para Regularizar",
          url: linkContato,
        }
      : {
          rotulo: "Acessar Plataforma Agora",
          url: `${URL_SISTEMA}/login`,
        },
    tom: isBloqueio ? "urgente" : "sucesso",
  });

  const textoPuro = `
ÁGUIAS ONE — Status de Acesso
Olá, ${nome}!

Seu acesso foi: ${isBloqueio ? "SUSPENSO" : "RESTABELECIDO"}.
Motivo/Observação: ${motivo} - ${observacoes}

Contato para suporte: ${linkContato}
  `.trim();

  return { tipo: "status_acesso", assunto, preheader, html, textoPuro };
}
