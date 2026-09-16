/**
 * Layout Base para E-mails Transacionais do Sistema ÁGUIAS ONE (v2)
 * Compatibilidade: Gmail, Outlook (Desktop/Web), Apple Mail, iOS Mail, Android Mail.
 * Diretrizes: Design moderno, cabeçalho escuro premium, card centralizado 600px,
 * tipografia escalável, botões acessíveis e rodapé institucional IBCAPPA / UniBCAPPA.
 */

export interface OpcoesBotaoCta {
  rotulo: string;
  url: string;
  destaque?: boolean;
}

export interface OpcoesLayoutEmail {
  preheader: string;
  tituloBadge?: string;
  titulo: string;
  subtitulo?: string;
  corpoHtml: string;
  ctaPrincipal?: OpcoesBotaoCta;
  ctaSecundario?: OpcoesBotaoCta;
  caixaDestaqueHtml?: string;
  tom?: "padrao" | "sucesso" | "alerta" | "urgente";
  linkAcessoWeb?: string;
}

const CORES_TOM = {
  padrao: {
    borda: "#0052FF",
    glow: "#00C2FF",
    badgeBg: "rgba(0, 82, 255, 0.12)",
    badgeTexto: "#0052FF",
  },
  sucesso: {
    borda: "#10B981",
    glow: "#34D399",
    badgeBg: "rgba(16, 185, 129, 0.12)",
    badgeTexto: "#059669",
  },
  alerta: {
    borda: "#F59E0B",
    glow: "#FBBF24",
    badgeBg: "rgba(245, 158, 11, 0.12)",
    badgeTexto: "#D97706",
  },
  urgente: {
    borda: "#EF4444",
    glow: "#F87171",
    badgeBg: "rgba(239, 68, 68, 0.12)",
    badgeTexto: "#DC2626",
  },
};

export function renderizarLayoutEmail(opcoes: OpcoesLayoutEmail): string {
  const {
    preheader,
    tituloBadge,
    titulo,
    subtitulo,
    corpoHtml,
    ctaPrincipal,
    ctaSecundario,
    caixaDestaqueHtml,
    tom = "padrao",
  } = opcoes;

  const configTom = CORES_TOM[tom];

  // Preheader invisível com padding de caracteres nulos para evitar que clientes
  // de email exibam trechos indesejados no snippet de prévia.
  const paddingPreheader = "&zwnj;&nbsp;".repeat(80);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${titulo}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #F3F4F6;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    table {
      border-spacing: 0;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    .btn-cta:hover {
      background-color: #0045D8 !important;
    }
    @media only screen and (max-width: 620px) {
      .conteudo-tabela {
        width: 100% !important;
        border-radius: 0 !important;
      }
      .espaco-lateral {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      .titulo-hero {
        font-size: 22px !important;
        line-height: 28px !important;
      }
      .btn-container {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; color: #111827;">

  <!-- Preheader Oculto -->
  <div style="display: none; font-size: 1px; color: #F3F4F6; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
    ${paddingPreheader}
  </div>

  <!-- Tabela Wrapper Principal -->
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; width: 100%; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 32px 12px 40px 12px;">

        <!-- Card Central 600px -->
        <table role="presentation" class="conteudo-tabela" width="600" border="0" cellspacing="0" cellpadding="0" style="width: 600px; max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08); border: 1px solid #E5E7EB;">

          <!-- Topbar / Cabeçalho Escuro Premium -->
          <tr>
            <td style="background-color: #0A0A0B; padding: 28px 36px; border-bottom: 3px solid ${configTom.borda};">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" valign="middle">
                    <div style="font-size: 18px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.5px; text-transform: uppercase;">
                      ÁGUIAS ONE <span style="color: ${configTom.glow}; font-size: 14px;">✦</span>
                    </div>
                    <div style="font-size: 11px; color: #9CA3AF; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 2px;">
                      Mentoria Pericial de Elite · IBCAPPA
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); color: #E5E7EB; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; border: 1px solid rgba(255, 255, 255, 0.15);">
                      Turma 2026.1
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo do E-mail -->
          <tr>
            <td class="espaco-lateral" style="padding: 36px 36px 28px 36px; background-color: #FFFFFF;">

              ${
                tituloBadge
                  ? `
              <!-- Badge de Categoria -->
              <div style="margin-bottom: 14px;">
                <span style="display: inline-block; background-color: ${configTom.badgeBg}; color: ${configTom.badgeTexto}; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${tituloBadge}
                </span>
              </div>
              `
                  : ""
              }

              <!-- Título Principal -->
              <h1 class="titulo-hero" style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: #111827; line-height: 32px; letter-spacing: -0.5px;">
                ${titulo}
              </h1>

              ${
                subtitulo
                  ? `
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #4B5563; line-height: 22px;">
                ${subtitulo}
              </p>
              `
                  : `<div style="height: 16px;"></div>`
              }

              <!-- Linha Divisória Suave -->
              <div style="height: 1px; background-color: #F3F4F6; margin-bottom: 24px;"></div>

              <!-- Conteúdo Dinâmico -->
              <div style="font-size: 15px; line-height: 24px; color: #374151;">
                ${corpoHtml}
              </div>

              ${
                caixaDestaqueHtml
                  ? `
              <!-- Caixa de Destaque / Instruções / Alerta -->
              <div style="margin: 24px 0; padding: 18px 20px; background-color: #F9FAFB; border-left: 4px solid ${configTom.borda}; border-radius: 0 8px 8px 0; border-top: 1px solid #F3F4F6; border-right: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6;">
                ${caixaDestaqueHtml}
              </div>
              `
                  : ""
              }

              ${
                ctaPrincipal
                  ? `
              <!-- Bloco de Botões de Ação -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 12px 0; width: 100%;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #0052FF;">
                          <a href="${ctaPrincipal.url}" target="_blank" class="btn-cta" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 8px; background-color: #0052FF; letter-spacing: 0.3px; mso-padding-alt: 0;">
                            <!--[if mso]><i style="letter-spacing: 28px; mso-font-width: -100%; mso-text-raise: 30pt">&nbsp;</i><![endif]-->
                            <span style="mso-text-raise: 15pt;">${ctaPrincipal.rotulo} &rarr;</span>
                            <!--[if mso]><i style="letter-spacing: 28px; mso-font-width: -100%">&nbsp;</i><![endif]-->
                          </a>
                        </td>
                      </tr>
                    </table>

                    ${
                      ctaSecundario
                        ? `
                    <div style="margin-top: 14px;">
                      <a href="${ctaSecundario.url}" target="_blank" style="font-size: 14px; font-weight: 600; color: #4B5563; text-decoration: underline;">
                        ${ctaSecundario.rotulo}
                      </a>
                    </div>
                    `
                        : ""
                    }
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Encontros ao Vivo / Caixa Informativa Fixa -->
              <div style="margin-top: 32px; padding: 14px 16px; background-color: #F8FAFC; border-radius: 8px; border: 1px dashed #CBD5E1; font-size: 13px; color: #64748B; line-height: 20px;">
                <strong>🗓️ Encontro ao vivo da turma:</strong> Todas as quartas-feiras, das 18:15 às 19:45 (Horário de Brasília). Traga suas dúvidas e participe ativamente.
              </div>

            </td>
          </tr>

          <!-- Rodapé Institucional -->
          <tr>
            <td style="background-color: #FAFAFA; padding: 28px 36px; border-top: 1px solid #E5E7EB; text-align: center;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #111827;">
                      ÁGUIAS ONE — Instituto Brasileiro de Capacitação e Pesquisa (IBCAPPA)
                    </div>
                    <p style="margin: 0 0 14px 0; font-size: 12px; color: #6B7280; line-height: 18px;">
                      Coordenação de Mentoria: Prof. Edilson Aguiais · Concierge: Flávio Lopes · Anjo: Ana Carolina
                    </p>

                    <div style="height: 1px; background-color: #E5E7EB; width: 60px; margin: 12px auto;"></div>

                    <p style="margin: 0; font-size: 11px; color: #9CA3AF; line-height: 16px;">
                      Você está recebendo este e-mail porque é aluno ou membro ativo da Mentoria ÁGUIAS ONE.<br />
                      Para suporte técnico ou dúvidas cadastrais, fale diretamente com o Concierge da Turma.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
