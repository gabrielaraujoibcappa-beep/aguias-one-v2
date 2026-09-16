const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const conf = {};
lines.forEach((l) => {
  const [k, ...v] = l.trim().split('=');
  if (k) conf[k] = v.join('=');
});

// Token pessoal do Supabase: nunca versionar. Use SUPABASE_ACCESS_TOKEN no ambiente ou no .env.local
const token = process.env.SUPABASE_ACCESS_TOKEN || conf.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Defina SUPABASE_ACCESS_TOKEN (variável de ambiente ou .env.local).');
  process.exit(1);
}
const projectRef = 'btktoxgcwjxcheuquezn';

function renderizarLayoutBasico({ preheader, tituloBadge, titulo, subtitulo, corpoHtml, ctaRotulo, ctaUrl, tom = 'padrao' }) {
  const paddingPreheader = '&zwnj;&nbsp;'.repeat(60);
  const corGlow = tom === 'sucesso' ? '#34D399' : tom === 'alerta' ? '#FBBF24' : '#00C2FF';
  const corBorda = tom === 'sucesso' ? '#10B981' : tom === 'alerta' ? '#F59E0B' : '#0052FF';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; color: #111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="display: none; font-size: 1px; color: #F3F4F6; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
    ${paddingPreheader}
  </div>
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; width: 100%;">
    <tr>
      <td align="center" style="padding: 32px 12px 40px 12px;">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #E5E7EB;">
          <tr>
            <td style="background-color: #0A0A0B; padding: 26px 36px; border-bottom: 3px solid ${corBorda};">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left">
                    <div style="font-size: 18px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase;">
                      ÁGUIAS ONE <span style="color: ${corGlow}; font-size: 14px;">✦</span>
                    </div>
                    <div style="font-size: 11px; color: #9CA3AF; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 2px;">
                      Mentoria Pericial de Elite · IBCAPPA
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); color: #E5E7EB; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.15);">
                      Turma 2026.1
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 28px 36px; background-color: #FFFFFF;">
              ${tituloBadge ? `<div style="margin-bottom: 12px;"><span style="display: inline-block; background-color: rgba(0, 82, 255, 0.1); color: #0052FF; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">${tituloBadge}</span></div>` : ''}
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #111827; line-height: 32px;">${titulo}</h1>
              ${subtitulo ? `<p style="margin: 0 0 20px 0; font-size: 15px; color: #4B5563; line-height: 22px;">${subtitulo}</p>` : ''}
              <div style="height: 1px; background-color: #F3F4F6; margin-bottom: 24px;"></div>
              <div style="font-size: 15px; line-height: 24px; color: #374151;">${corpoHtml}</div>
              ${ctaRotulo && ctaUrl ? `
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 16px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 8px; background-color: #0052FF;">
                      ${ctaRotulo} &rarr;
                    </a>
                  </td>
                </tr>
              </table>` : ''}
              <div style="margin-top: 32px; padding: 14px 16px; background-color: #F8FAFC; border-radius: 8px; border: 1px dashed #CBD5E1; font-size: 13px; color: #64748B; line-height: 20px;">
                <strong>🗓️ Encontro ao vivo da turma:</strong> Todas as quartas-feiras, das 18:15 às 19:45 (Horário de Brasília).
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FAFAFA; padding: 24px 36px; border-top: 1px solid #E5E7EB; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #111827;">ÁGUIAS ONE — Instituto Brasileiro de Capacitação e Pesquisa (IBCAPPA)</p>
              <p style="margin: 0; font-size: 11px; color: #9CA3AF;">Coordenação: Prof. Edilson Aguiais · Concierge: Flávio Lopes · Anjo: Ana Carolina</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sincronizar() {
  console.log('Gerando templates oficiais para o Supabase Auth...');

  const inviteHtml = renderizarLayoutBasico({
    preheader: 'Você foi convidado para a Mentoria ÁGUIAS ONE. Ative seu acesso.',
    tituloBadge: 'Convite Oficial',
    titulo: 'Bem-vindo ao ÁGUIAS ONE!',
    subtitulo: 'Sua vaga no programa de aceleração pericial da UniBCAPPA / IBCAPPA está confirmada.',
    corpoHtml: `
      <p>Olá!</p>
      <p>Você foi convidado para integrar o <strong>ÁGUIAS ONE</strong> (Turma 2026.1).</p>
      <p>Para ativar sua conta, confirmar seu e-mail e cadastrar sua senha pessoal de acesso, clique no botão abaixo:</p>
    `,
    ctaRotulo: 'Aceitar Convite & Ativar Conta',
    ctaUrl: '{{ .ConfirmationURL }}',
  });

  const recoveryHtml = renderizarLayoutBasico({
    preheader: 'Solicitação de redefinição de senha para sua conta ÁGUIAS ONE.',
    tituloBadge: 'Segurança da Conta',
    titulo: 'Redefinição de Senha',
    subtitulo: 'Crie uma nova senha de acesso à plataforma.',
    corpoHtml: `
      <p>Olá!</p>
      <p>Recebemos um pedido para redefinir a senha da sua conta no <strong>ÁGUIAS ONE</strong> associada ao e-mail <strong>{{ .Email }}</strong>.</p>
      <p>Para prosseguir com a redefinição e cadastrar uma nova senha, clique no botão abaixo:</p>
    `,
    ctaRotulo: 'Cadastrar Nova Senha',
    ctaUrl: '{{ .ConfirmationURL }}',
    tom: 'alerta',
  });

  const magicLinkHtml = renderizarLayoutBasico({
    preheader: 'Seu link de acesso instantâneo ao ÁGUIAS ONE.',
    tituloBadge: 'Login Rápido',
    titulo: 'Entrar sem Senha',
    subtitulo: 'Acesso instantâneo e seguro à plataforma.',
    corpoHtml: `
      <p>Olá!</p>
      <p>Você solicitou um link de acesso rápido para entrar diretamente na sua conta da Mentoria <strong>ÁGUIAS ONE</strong>.</p>
      <p>Clique no botão abaixo para entrar na plataforma:</p>
    `,
    ctaRotulo: 'Entrar no ÁGUIAS ONE Agora',
    ctaUrl: '{{ .ConfirmationURL }}',
  });

  const confirmationHtml = renderizarLayoutBasico({
    preheader: 'Confirme seu endereço de e-mail para validar sua conta ÁGUIAS ONE.',
    tituloBadge: 'Validação Cadastral',
    titulo: 'Confirme seu E-mail',
    subtitulo: 'Etapa necessária para liberação das aulas e check-ins.',
    corpoHtml: `
      <p>Olá!</p>
      <p>Falta apenas um clique para validar o seu e-mail e liberar todas as funcionalidades da plataforma <strong>ÁGUIAS ONE</strong>.</p>
    `,
    ctaRotulo: 'Confirmar Meu E-mail',
    ctaUrl: '{{ .ConfirmationURL }}',
    tom: 'sucesso',
  });

  const payload = {
    mailer_subjects_invite: '🦅 Bem-vindo ao ÁGUIAS ONE — Convite de Acesso',
    mailer_templates_invite_content: inviteHtml,
    mailer_subjects_recovery: '🔑 Redefinição de Senha — ÁGUIAS ONE',
    mailer_templates_recovery_content: recoveryHtml,
    mailer_subjects_magic_link: '🔗 Seu Link de Acesso — ÁGUIAS ONE',
    mailer_templates_magic_link_content: magicLinkHtml,
    mailer_subjects_confirmation: '✅ Confirme seu E-mail — ÁGUIAS ONE',
    mailer_templates_confirmation_content: confirmationHtml,
  };

  const patchUrl = 'https://api.supabase.com/v1/projects/' + projectRef + '/config/auth';
  const res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  console.log('Status da resposta Supabase:', res.status);
  const data = await res.json();
  if (res.ok) {
    console.log('✅ Templates de E-mail do Supabase Auth ATUALIZADOS com sucesso!');
    console.log('Remetente:', data.smtp_sender_name);
    console.log('Assuntos configurados:');
    console.log('  1. Convite:', data.mailer_subjects_invite);
    console.log('  2. Recuperação de Senha:', data.mailer_subjects_recovery);
    console.log('  3. Magic Link:', data.mailer_subjects_magic_link);
    console.log('  4. Confirmação:', data.mailer_subjects_confirmation);
  } else {
    console.error('❌ Erro ao atualizar Supabase:', data);
  }
}

sincronizar();
