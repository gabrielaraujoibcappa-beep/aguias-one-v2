"use client";

import React, { useState, useEffect } from "react";
import { TEMPLATES_CATALOGO, TemplateInfo } from "@/lib/email/dados-exemplo";
import { ResultadoEmail } from "@/lib/email/templates";
import { Button } from "@/components/ui/Button";
import { ToastDesfazer } from "@/components/ui/ToastDesfazer";
import {
  IconMail,
  IconCopy,
  IconMonitor,
  IconSmartphone,
  IconCheckCircle,
} from "@/components/ui/Icons";

export default function AdminEmailsPage() {
  const [templateSelecionado, setTemplateSelecionado] = useState<TemplateInfo>(
    TEMPLATES_CATALOGO[0]
  );
  const [emailRenderizado, setEmailRenderizado] = useState<ResultadoEmail>(
    () => TEMPLATES_CATALOGO[0].renderizar()
  );
  const [modoVisualizacao, setModoVisualizacao] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [abaAtiva, setAbaAtiva] = useState<"visual" | "texto" | "codigo">(
    "visual"
  );
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // Modal de Envio de Teste
  const [modalEnvioAberto, setModalEnvioAberto] = useState(false);
  const [emailDestino, setEmailDestino] = useState("roberto.silva@pericia.com.br");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setEmailRenderizado(templateSelecionado.renderizar());
  }, [templateSelecionado]);

  const copiarParaClipboard = (texto: string, mensagem: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setToastFeedback(mensagem);
    }
  };

  const handleEnviarTeste = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch("/api/emails/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinatario: emailDestino,
          templateId: templateSelecionado.id,
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setToastFeedback(`E-mail de teste enviado para ${emailDestino}!`);
        setModalEnvioAberto(false);
      } else {
        alert(data.erro || "Falha ao enviar e-mail de teste.");
      }
    } catch (err: any) {
      alert("Erro ao conectar com servidor: " + err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ maxWidth: "1380px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: "var(--espaco-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ color: "var(--cor-action-vibrant, #0052ff)" }}>
            <IconMail size={24} />
          </span>
          <h1 style={{ fontSize: "28px", margin: 0, fontWeight: 800 }}>
            Central de Templates de E-mail
          </h1>
        </div>
        <p style={{ color: "var(--cor-muted)", fontSize: "15px", margin: 0 }}>
          Catálogo oficial de templates transacionais e operacionais do <strong>ÁGUIAS ONE</strong>.
          Visualize, copie o HTML responsivo ou envie disparos de teste.
        </p>
      </div>

      {/* Grid Principal: Seletor à esquerda + Prévia à direita */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "24px", alignItems: "start" }}>

        {/* Coluna Esquerda: Lista de Templates */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-md, 12px)",
          border: "1px solid var(--cor-border, #e5e7eb)",
          padding: "16px",
          boxShadow: "var(--sombra-suave)",
        }}>
          <div style={{
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "var(--cor-muted)",
            letterSpacing: "0.5px",
            marginBottom: "12px",
            paddingLeft: "8px",
          }}>
            Modelos Disponíveis ({TEMPLATES_CATALOGO.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {TEMPLATES_CATALOGO.map((item) => {
              const ativo = item.id === templateSelecionado.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTemplateSelecionado(item)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: ativo ? "1px solid var(--cor-action-vibrant, #0052ff)" : "1px solid transparent",
                    backgroundColor: ativo ? "rgba(0, 82, 255, 0.06)" : "#F9FAFB",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{
                    fontSize: "14px",
                    fontWeight: ativo ? 700 : 600,
                    color: ativo ? "var(--cor-action-vibrant, #0052ff)" : "var(--cor-ink, #111827)",
                    marginBottom: "4px",
                  }}>
                    {item.nome}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "var(--cor-muted, #6b7280)",
                    lineHeight: "16px",
                  }}>
                    {item.descricao}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Área de Prévia e Ações */}
        <div style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "var(--radius-md, 12px)",
          border: "1px solid var(--cor-border, #e5e7eb)",
          overflow: "hidden",
          boxShadow: "var(--sombra-suave)",
        }}>

          {/* Barra Superior da Prévia */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--cor-border, #e5e7eb)",
            backgroundColor: "#FBFBFC",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}>
            {/* Metadados do Assunto */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--cor-muted)", letterSpacing: "0.5px" }}>
                Assunto do E-mail
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--cor-ink)", marginTop: "2px" }}>
                {emailRenderizado.assunto}
              </div>
            </div>

            {/* Alternadores de Modo e Ações */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Dispositivo: Desktop / Mobile */}
              <div style={{
                display: "inline-flex",
                backgroundColor: "#E5E7EB",
                padding: "3px",
                borderRadius: "6px",
              }}>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("desktop")}
                  title="Visualização Desktop"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backgroundColor: modoVisualizacao === "desktop" ? "#FFFFFF" : "transparent",
                    color: modoVisualizacao === "desktop" ? "#111827" : "#6B7280",
                    boxShadow: modoVisualizacao === "desktop" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <IconMonitor size={14} />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("mobile")}
                  title="Visualização Mobile (375px)"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    backgroundColor: modoVisualizacao === "mobile" ? "#FFFFFF" : "transparent",
                    color: modoVisualizacao === "mobile" ? "#111827" : "#6B7280",
                    boxShadow: modoVisualizacao === "mobile" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <IconSmartphone size={14} />
                  <span>Mobile</span>
                </button>
              </div>

              {/* Botão Copiar HTML */}
              <Button
                variante="secundario"
                tamanho="sm"
                onClick={() =>
                  copiarParaClipboard(
                    emailRenderizado.html,
                    "Código HTML copiado com sucesso!"
                  )
                }
              >
                <IconCopy size={14} />
                <span>Copiar HTML</span>
              </Button>

              {/* Botão Enviar Teste */}
              <Button
                variante="primario"
                tamanho="sm"
                onClick={() => setModalEnvioAberto(true)}
              >
                <IconMail size={14} />
                <span>Enviar Teste</span>
              </Button>
            </div>
          </div>

          {/* Abas: Visual vs Texto vs Código */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid var(--cor-border, #e5e7eb)",
            backgroundColor: "#FFFFFF",
            padding: "0 20px",
          }}>
            <button
              type="button"
              onClick={() => setAbaAtiva("visual")}
              style={{
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderBottom: abaAtiva === "visual" ? "2px solid var(--cor-action-vibrant, #0052ff)" : "2px solid transparent",
                color: abaAtiva === "visual" ? "var(--cor-action-vibrant, #0052ff)" : "var(--cor-muted)",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
            >
              Visualização Renderizada
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva("texto")}
              style={{
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderBottom: abaAtiva === "texto" ? "2px solid var(--cor-action-vibrant, #0052ff)" : "2px solid transparent",
                color: abaAtiva === "texto" ? "var(--cor-action-vibrant, #0052ff)" : "var(--cor-muted)",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
            >
              Versão Texto Puro
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva("codigo")}
              style={{
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                border: "none",
                borderBottom: abaAtiva === "codigo" ? "2px solid var(--cor-action-vibrant, #0052ff)" : "2px solid transparent",
                color: abaAtiva === "codigo" ? "var(--cor-action-vibrant, #0052ff)" : "var(--cor-muted)",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
            >
              Código HTML Inline
            </button>
          </div>

          {/* Conteúdo da Aba */}
          <div style={{
            backgroundColor: "#F3F4F6",
            padding: "24px",
            minHeight: "560px",
            display: "flex",
            justifyContent: "center",
            overflow: "auto",
          }}>

            {abaAtiva === "visual" && (
              <div style={{
                width: modoVisualizacao === "mobile" ? "375px" : "100%",
                maxWidth: modoVisualizacao === "mobile" ? "375px" : "640px",
                transition: "width 0.2s ease, max-width 0.2s ease",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
                borderRadius: "12px",
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
              }}>
                <iframe
                  title="Prévia do E-mail"
                  srcDoc={emailRenderizado.html}
                  style={{
                    width: "100%",
                    height: "680px",
                    border: "none",
                    display: "block",
                  }}
                />
              </div>
            )}

            {abaAtiva === "texto" && (
              <div style={{
                width: "100%",
                maxWidth: "640px",
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                padding: "24px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#6B7280",
                  marginBottom: "8px",
                }}>
                  Texto Puro (Fallback para clientes sem HTML):
                </div>
                <pre style={{
                  fontFamily: "monospace",
                  fontSize: "13px",
                  lineHeight: "20px",
                  whiteSpace: "pre-wrap",
                  color: "#1F2937",
                  margin: 0,
                  backgroundColor: "#F9FAFB",
                  padding: "16px",
                  borderRadius: "6px",
                  border: "1px solid #E5E7EB",
                }}>
                  {emailRenderizado.textoPuro}
                </pre>
              </div>
            )}

            {abaAtiva === "codigo" && (
              <div style={{
                width: "100%",
                maxWidth: "800px",
                backgroundColor: "#0A0A0B",
                borderRadius: "8px",
                padding: "20px",
                overflow: "auto",
                maxHeight: "680px",
              }}>
                <pre style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: "#E5E7EB",
                  margin: 0,
                }}>
                  {emailRenderizado.html}
                </pre>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Modal de Envio de Teste */}
      {modalEnvioAberto && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px",
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "460px",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700 }}>
              Enviar E-mail de Teste
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "var(--cor-muted)" }}>
              Você está prestes a enviar uma prévia do modelo <strong>"{templateSelecionado.nome}"</strong>.
            </p>

            <form onSubmit={handleEnviarTeste}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  E-mail de Destino:
                </label>
                <input
                  type="email"
                  required
                  value={emailDestino}
                  onChange={(e) => setEmailDestino(e.target.value)}
                  className="input-padrao"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid var(--cor-border, #d1d5db)",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Button
                  type="button"
                  variante="secundario"
                  onClick={() => setModalEnvioAberto(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variante="primario"
                  carregando={enviando}
                >
                  Enviar Agora
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast de Feedback */}
      {toastFeedback && (
        <ToastDesfazer
          visivel={Boolean(toastFeedback)}
          mensagem={toastFeedback}
          onFechar={() => setToastFeedback(null)}
        />
      )}
    </div>
  );
}
