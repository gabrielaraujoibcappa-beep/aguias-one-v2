"use client";

import React, { useState } from "react";
import {
  AlunoCadastro,
  DadosCriacaoUsuario,
  validarCriacaoUsuario,
  validarDadosAluno,
  gerarMensagemAcessoWhatsApp,
  criarContaUsuario,
} from "@/lib/api/alunos";
import { PapelUsuario } from "@/lib/auth/roles";
import { Button } from "@/components/ui/Button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { IconCheckCircle, IconWhatsApp, IconX, IconAlertCircle } from "@/components/ui/Icons";

interface ModalAlunoProps {
  aberto: boolean;
  alunoInicial?: AlunoCadastro | null;
  turmas: { id: string; nome: string }[];
  onSalvar: (dados: AlunoCadastro) => void;
  onFechar: () => void;
}

export function ModalAluno({ aberto, alunoInicial, turmas, onSalvar, onFechar }: ModalAlunoProps) {
  const isEdicao = Boolean(alunoInicial);

  const [nome, setNome] = useState(alunoInicial?.nome || "");
  const [email, setEmail] = useState(alunoInicial?.email || "");
  const [senha, setSenha] = useState("123456");
  const [whatsapp, setWhatsapp] = useState(alunoInicial?.whatsapp || "");
  const [cpf, setCpf] = useState(alunoInicial?.cpf || "");
  const [areaPericial, setAreaPericial] = useState(alunoInicial?.areaPericial || "Contábil");
  const [turmaId, setTurmaId] = useState(alunoInicial?.turmaId || (turmas[0]?.id || ""));
  const [papel, setPapel] = useState<PapelUsuario>(alunoInicial?.papel || "mentorado");
  const [status, setStatus] = useState<AlunoCadastro["status"]>(alunoInicial?.status || "ativo");

  const [erros, setErros] = useState<string[]>([]);
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Estado de sucesso pós-criação com credenciais prontas
  const [sucessoCriacao, setSucessoCriacao] = useState<{
    email: string;
    senha: string;
    nome: string;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (!aberto) return null;

  const gerarSenhaForte = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let gerada = "Aguia@";
    for (let i = 0; i < 4; i++) {
      gerada += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSenha(gerada);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroApi(null);

    const dadosBase = {
      id: alunoInicial?.id,
      nome,
      email,
      whatsapp,
      cpf,
      areaPericial,
      turmaId,
      turmaNome: turmas.find((t) => t.id === turmaId)?.nome,
      status,
      papel,
    };

    if (isEdicao) {
      const validacao = validarDadosAluno(dadosBase);
      if (!validacao.valido) {
        setErros(validacao.erros);
        return;
      }
      onSalvar(dadosBase);
      onFechar();
      return;
    }

    // Fluxo de Criação de Novo Usuário pelo Administrador
    const dadosCriacao: DadosCriacaoUsuario = {
      ...dadosBase,
      senha,
    };

    const validacao = validarCriacaoUsuario(dadosCriacao);
    if (!validacao.valido) {
      setErros(validacao.erros);
      return;
    }

    setSalvando(true);

    try {
      // Chama o endpoint de provisionamento no Supabase
      const res = await criarContaUsuario(dadosCriacao);
      if (!res.sucesso) {
        setErroApi(res.erro || "Não foi possível criar o usuário no Supabase.");
        setSalvando(false);
        return;
      }

      const idGerado = res.id || `usr-${Date.now()}`;
      onSalvar({ ...dadosBase, id: idGerado });

      // Exibe tela de sucesso e dados para WhatsApp
      setSucessoCriacao({
        nome,
        email,
        senha,
      });
    } catch (err: any) {
      setErroApi(err.message || "Erro inesperado ao criar usuário.");
    } finally {
      setSalvando(false);
    }
  };

  const handleCopiarWhatsApp = () => {
    if (!sucessoCriacao) return;
    const texto = gerarMensagemAcessoWhatsApp({
      nome: sucessoCriacao.nome,
      email: sucessoCriacao.email,
      senha: sucessoCriacao.senha,
      linkAcesso: typeof window !== "undefined" ? `${window.location.origin}/login` : "http://localhost:3000/login",
    });

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3500);
    }
  };

  const handleConcluir = () => {
    setSucessoCriacao(null);
    onFechar();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 10, 11, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "560px",
          backgroundColor: "#ffffff",
          borderRadius: "var(--radius-md, 12px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          padding: "28px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* TELA DE SUCESSO PÓS-CRIAÇÃO COM BOTÃO WHATSAPP */}
        {sucessoCriacao ? (
          <div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: "#ecfdf5",
                  color: "#059669",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <IconCheckCircle size={28} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>
                Conta Criada com Sucesso!
              </h3>
              <p style={{ fontSize: "14px", color: "var(--cor-muted, #4b5563)" }}>
                O perito foi provisionado no Supabase e vinculado à turma.
              </p>
            </div>

            {/* Caixa com as Credenciais */}
            <div
              style={{
                backgroundColor: "var(--cor-soft-stone, #f8f9fa)",
                border: "1px solid var(--cor-border-light, #e5e7eb)",
                borderRadius: "var(--radius-sm, 8px)",
                padding: "16px",
                marginBottom: "20px",
                fontFamily: "var(--font-family-mono)",
                fontSize: "13px",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <span style={{ color: "var(--cor-muted, #6b7280)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                  Nome Completo
                </span>
                <strong>{sucessoCriacao.nome}</strong>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ color: "var(--cor-muted, #6b7280)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                  Email de Acesso
                </span>
                <strong>{sucessoCriacao.email}</strong>
              </div>
              <div>
                <span style={{ color: "var(--cor-muted, #6b7280)", display: "block", fontSize: "11px", textTransform: "uppercase" }}>
                  Senha Inicial
                </span>
                <span style={{ backgroundColor: "#ffffff", padding: "2px 6px", borderRadius: "4px", border: "1px solid #d1d5db" }}>
                  {sucessoCriacao.senha}
                </span>
              </div>
            </div>

            {/* Ações de Envio WhatsApp & Concluir */}
            <ButtonGroup alinhamento="justificado">
              <Button
                type="button"
                variante="secundario"
                iconeInicio={<IconWhatsApp size={16} />}
                onClick={handleCopiarWhatsApp}
              >
                {copiado ? "Mensagem Copiada! ✓" : "Copiar para WhatsApp"}
              </Button>

              <Button type="button" variante="primario" onClick={handleConcluir}>
                Concluir Cadastro
              </Button>
            </ButtonGroup>
          </div>
        ) : (
          /* FORMULÁRIO DE CADASTRO / EDIÇÃO */
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--cor-ink, #111827)" }}>
                  {isEdicao ? "Editar Cadastro do Aluno" : "Criar Nova Conta de Usuário"}
                </h3>
                <p style={{ fontSize: "12px", color: "var(--cor-muted, #6b7280)", marginTop: "2px" }}>
                  {isEdicao
                    ? "Atualize as informações cadastrais do mentorado."
                    : "Cadastre o perito, defina o papel e gere a senha de acesso."}
                </p>
              </div>

              <button
                type="button"
                onClick={onFechar}
                aria-label="Fechar modal"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  color: "var(--cor-muted, #6b7280)",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <IconX size={18} />
              </button>
            </div>

            {erroApi && (
              <div
                role="alert"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-xs, 4px)",
                  marginBottom: "16px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IconAlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{erroApi}</span>
              </div>
            )}

            {erros.length > 0 && (
              <div
                role="alert"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-xs, 4px)",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                Por favor, preencha os campos obrigatórios em destaque.
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Nome Completo */}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Dr. Roberto Alcantara"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "var(--radius-xs, 6px)",
                    border: erros.includes("nome") ? "1px solid #dc2626" : "1px solid var(--cor-border-light, #d1d5db)",
                    fontSize: "14px",
                  }}
                />
              </div>

              {/* Email e WhatsApp */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Email de Acesso *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="perito@email.com.br"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "var(--radius-xs, 6px)",
                      border: erros.includes("email") ? "1px solid #dc2626" : "1px solid var(--cor-border-light, #d1d5db)",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-8888"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "var(--radius-xs, 6px)",
                      border: erros.includes("whatsapp") ? "1px solid #dc2626" : "1px solid var(--cor-border-light, #d1d5db)",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* Senha Inicial (apenas na criação) */}
              {!isEdicao && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600 }}>
                      Senha Inicial de Acesso *
                    </label>
                    <button
                      type="button"
                      onClick={gerarSenhaForte}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--cor-action-vibrant, #0052ff)",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      ✦ Gerar Senha Forte
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres (ex: 123456)"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "var(--radius-xs, 6px)",
                      border: erros.includes("senha") ? "1px solid #dc2626" : "1px solid var(--cor-border-light, #d1d5db)",
                      fontSize: "14px",
                      fontFamily: "var(--font-family-mono)",
                    }}
                  />
                </div>
              )}

              {/* Papel e Turma */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Papel no Sistema *
                  </label>
                  <select
                    value={papel}
                    onChange={(e) => setPapel(e.target.value as PapelUsuario)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "var(--radius-xs, 6px)",
                      border: "1px solid var(--cor-border-light, #d1d5db)",
                      fontSize: "14px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <option value="mentorado">Mentorado (Perito)</option>
                    <option value="concierge">Concierge da Turma</option>
                    <option value="anjo">Anjo & Auditoria</option>
                    <option value="mentor">Mentor / Coordenação</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Turma Vinculada *
                  </label>
                  <select
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "var(--radius-xs, 6px)",
                      border: "1px solid var(--cor-border-light, #d1d5db)",
                      fontSize: "14px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Área Pericial e CPF */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Área Pericial
                  </label>
                  <input
                    type="text"
                    value={areaPericial}
                    onChange={(e) => setAreaPericial(e.target.value)}
                    placeholder="Ex: Contábil, Grafotécnica"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "var(--radius-xs, 6px)",
                      border: "1px solid var(--cor-border-light, #d1d5db)",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "var(--radius-xs, 6px)",
                      border: "1px solid var(--cor-border-light, #d1d5db)",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* Botões de Ação com Hierarquia Câmara UX */}
              <div style={{ marginTop: "12px" }}>
                <ButtonGroup alinhamento="direita">
                  <Button type="button" variante="secundario" onClick={onFechar} disabled={salvando}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variante="primario"
                    carregando={salvando}
                    textoCarregando="Criando Conta..."
                  >
                    {isEdicao ? "Salvar Alterações" : "Criar Conta de Acesso"}
                  </Button>
                </ButtonGroup>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
