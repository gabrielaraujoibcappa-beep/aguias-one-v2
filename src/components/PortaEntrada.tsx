import React from "react";
import Link from "next/link";
import {
  IconAudit,
  IconCalendar,
  IconCheckCircle,
  IconCurrency,
  IconDashboard,
  IconFolder,
  IconGlobe,
  IconMail,
} from "@/components/ui/Icons";

const AREAS = [
  {
    titulo: "Visão geral",
    texto: "Semáforo da semana, pendências e o módulo que já foi liberado.",
    Icone: IconDashboard,
  },
  {
    titulo: "Placar de entrada",
    texto: "O diagnóstico da sua jornada — o ponto de partida do acompanhamento.",
    Icone: IconAudit,
  },
  {
    titulo: "Check-in modular",
    texto: "Evidências, travas e dúvidas do módulo para o encontro da quarta.",
    Icone: IconCheckCircle,
  },
  {
    titulo: "Faturamento",
    texto: "Declaração mensal em R$ com comprovantes avulsos ou pacote .zip.",
    Icone: IconCurrency,
  },
  {
    titulo: "Canais",
    texto: "Os 7 canais do escritório: WhatsApp, Google, Instagram, site, newsletter, YouTube e ads.",
    Icone: IconGlobe,
  },
  {
    titulo: "Materiais",
    texto: "Kits, contratos e templates da mentoria, para baixar na visão geral.",
    Icone: IconFolder,
  },
] as const;

const PASSOS = [
  {
    n: "1",
    titulo: "Use o e-mail cadastrado",
    texto: "É o mesmo que o Concierge registrou na matrícula. Não há cadastro aberto nesta tela.",
  },
  {
    n: "2",
    titulo: "Entre com senha ou link",
    texto: "No login você informa a senha ou pede um link de acesso no e-mail, válido por 1 hora.",
  },
  {
    n: "3",
    titulo: "Você cai na sua jornada",
    texto: "A visão geral mostra o que está pendente: check-in, faturamento e canais.",
  },
] as const;

/**
 * Porta pública do sistema — lobby do mentorado, não página de venda.
 */
export function PortaEntrada() {
  return (
    <div className="porta-entrada">
      <a className="porta-skip" href="#porta-titulo">
        Ir para o conteúdo
      </a>

      <header className="porta-topo">
        <img src="/logo-aguias-one.png" alt="ÁGUIAS ONE Mentoria" className="porta-logo" />
        <div className="porta-topo-acoes">
          <p className="porta-instituicao">IBCAPPA · UniBCAPPA</p>
          <Link href="/login" className="btn-secondary btn-sm">
            Entrar
          </Link>
        </div>
      </header>

      <div className="porta-corpo">
        <div className="porta-abertura">
          <section className="porta-hero" aria-labelledby="porta-titulo">
            <h1 id="porta-titulo" className="porta-titulo">
              Esta é a porta do ÁGUIAS ONE.
            </h1>
            <p className="porta-lead">
              Entre com o acesso que o Concierge já liberou.
              <br />
              Aqui você acompanha a jornada, entrega o check-in e declara o faturamento.
            </p>
            <div className="porta-acoes">
              <Link href="/login" className="btn-primary btn-lg">
                Entrar no sistema
              </Link>
              <Link href="/login" className="porta-ajuda">
                Receber link no e-mail cadastrado
              </Link>
            </div>
          </section>

          <section className="porta-passos" aria-labelledby="porta-passos-titulo">
            <h2 id="porta-passos-titulo">Como entrar</h2>
            <ol className="porta-passos-lista">
              {PASSOS.map((passo) => (
                <li key={passo.n}>
                  <span className="porta-passo-n" aria-hidden="true">
                    {passo.n}
                  </span>
                  <div>
                    <h3>{passo.titulo}</h3>
                    <p>{passo.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <aside className="porta-encontro" aria-labelledby="porta-encontro-titulo">
              <IconCalendar size={18} aria-hidden="true" />
              <div>
                <h3 id="porta-encontro-titulo">Encontro às quartas</h3>
                <p>Check-in, travas e dúvidas da semana entram por aqui, antes da call.</p>
              </div>
            </aside>
          </section>
        </div>

        <section className="porta-mapa" aria-labelledby="porta-mapa-titulo">
          <h2 id="porta-mapa-titulo">O que você encontra</h2>
          <ul className="porta-lista">
            {AREAS.map(({ titulo, texto, Icone }) => (
              <li key={titulo}>
                <span className="porta-lista-icone" aria-hidden="true">
                  <Icone size={18} />
                </span>
                <div>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="porta-ajuda-bloco" aria-labelledby="porta-ajuda-titulo">
          <IconMail size={20} aria-hidden="true" />
          <div>
            <h2 id="porta-ajuda-titulo">Sem senha?</h2>
            <p>
              Na tela Entrar, peça o link no e-mail da matrícula. Não há canal público de WhatsApp
              nesta porta.
            </p>
          </div>
          <Link href="/login" className="btn-secondary">
            Ir para o login
          </Link>
        </section>
      </div>

      <footer className="porta-rodape">
        Acesso restrito a quem já está na mentoria · IBCAPPA · UniBCAPPA — Negócios Periciais.
      </footer>
    </div>
  );
}
