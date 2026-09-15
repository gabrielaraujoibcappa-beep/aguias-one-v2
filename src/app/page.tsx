"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { PapelUsuario } from "@/lib/auth/roles";
import {
  IconUsers,
  IconUnlock,
  IconBuilding,
  IconArrowRight,
  LogoEmblem,
} from "@/components/ui/Icons";

export default function HomePage() {
  const router = useRouter();
  const { mudarPapel } = useSistemaStore();

  const irPara = (href: string, papel: PapelUsuario) => {
    mudarPapel(papel);
    router.push(href);
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "var(--espaco-xxl) var(--espaco-lg)" }}>
      {/* Header Editorial Cohere */}
      <div style={{ textAlign: "center", marginBottom: "var(--espaco-section)" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          backgroundColor: "var(--cor-soft-stone)",
          color: "var(--cor-primary)",
          padding: "4px 12px",
          borderRadius: "var(--radius-xs)",
          marginBottom: "var(--espaco-md)",
          fontFamily: "var(--font-family-mono)",
        }}>
          <LogoEmblem size={13} style={{ color: "var(--cor-deep-green)" }} />
          <span>ÁGUIAS ONE · Pós-Graduação em Negócios Periciais</span>
        </div>

        <h1 style={{
          fontSize: "42px",
          fontWeight: 600,
          letterSpacing: "-1px",
          lineHeight: 1.1,
          marginBottom: "var(--espaco-md)",
          color: "var(--cor-primary)",
          fontFamily: "var(--font-family-display)",
        }}>
          Operação Estratégica do Escritório Pericial
        </h1>
        <p style={{
          fontSize: "17px",
          color: "var(--cor-body-muted)",
          maxWidth: "680px",
          margin: "0 auto",
          lineHeight: 1.5,
        }}>
          Plataforma de acompanhamento prático, liberação ativa de módulos, auditoria de evidências e declaração de receita para peritos do programa.
        </p>
      </div>

      {/* Grid de Portais Sórbrio e Sem Clichês de IA */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "var(--espaco-xl)",
      }}>
        {/* Bloco 1: Área do Mentorado */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-xl)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--espaco-xs)", color: "var(--cor-primary)" }}>
              <IconUsers size={18} />
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Área do Mentorado</h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--cor-body-muted)", marginBottom: "var(--espaco-lg)", lineHeight: 1.5 }}>
              Ambiente do aluno para gerenciar a rotina, submeter check-ins práticos e declarar o faturamento mensal com comprovantes.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => irPara("/dashboard", "mentorado")}
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                padding: "10px",
              }}
            >
              <span>Acessar Visão Geral</span>
              <IconArrowRight size={14} />
            </button>
            <button
              onClick={() => irPara("/checkin/mod-1", "mentorado")}
              className="btn-secondary"
              style={{
                width: "100%",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                padding: "8px",
              }}
            >
              Check-in Módulo 1 (Pastas Google Drive)
            </button>
            <button
              onClick={() => irPara("/faturamento", "mentorado")}
              className="btn-secondary"
              style={{
                width: "100%",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                padding: "8px",
              }}
            >
              Faturamento & Comprovantes (.ZIP)
            </button>
            <button
              onClick={() => irPara("/canais", "mentorado")}
              className="btn-secondary"
              style={{
                width: "100%",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                padding: "8px",
              }}
            >
              Canais de Atração (7 Canais)
            </button>
          </div>
        </div>

        {/* Bloco 2: Painel da Equipe */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-xl)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--espaco-xs)", color: "var(--cor-primary)" }}>
              <IconUnlock size={18} />
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Operação & Turma</h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--cor-body-muted)", marginBottom: "var(--espaco-lg)", lineHeight: 1.5 }}>
              Painel para o encontro semanal de quarta com Flávio Lopes, esteira de liberação e auditoria técnica das entregas.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => irPara("/painel/turma", "concierge")}
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                padding: "10px",
                backgroundColor: "var(--cor-primary)",
              }}
            >
              <span>Painel da Turma & Semáforo</span>
              <IconArrowRight size={14} />
            </button>
            <button
              onClick={() => irPara("/painel/modulos", "anjo")}
              className="btn-secondary"
              style={{
                width: "100%",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                padding: "8px",
              }}
            >
              Liberação de Módulos (Anjo)
            </button>
            <button
              onClick={() => irPara("/painel/auditoria", "anjo")}
              className="btn-secondary"
              style={{
                width: "100%",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                padding: "8px",
              }}
            >
              Fila de Auditoria de Entregas
            </button>
          </div>
        </div>

        {/* Bloco 3: Gestão Administrativa */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-xl)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--espaco-xs)", color: "var(--cor-primary)" }}>
              <IconBuilding size={18} />
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Cadastros & Coordenação</h2>
            </div>
            <p style={{ fontSize: "13px", color: "var(--cor-body-muted)", marginBottom: "var(--espaco-lg)", lineHeight: 1.5 }}>
              Central administrativa para a coordenação gerenciar matrículas de mentorados e cronogramas de turmas.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => irPara("/admin/alunos", "admin")}
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                padding: "10px",
                backgroundColor: "var(--cor-primary)",
              }}
            >
              <span>Gestão de Alunos (CRUD)</span>
              <IconArrowRight size={14} />
            </button>
            <button
              onClick={() => irPara("/admin/turmas", "admin")}
              className="btn-secondary"
              style={{
                width: "100%",
                justifyContent: "center",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                padding: "8px",
              }}
            >
              Gestão de Turmas & Vagas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
