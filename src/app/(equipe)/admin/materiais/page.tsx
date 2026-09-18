"use client";

import React, { useCallback, useEffect, useState } from "react";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

interface MaterialPublicado {
  path: string;
  titulo: string;
  tipo: string;
  tamanho: string;
  publicadoEm: string | null;
  downloadUrl: string;
}

export default function AdminMateriaisPage() {
  const [materiais, setMateriais] = useState<MaterialPublicado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [tituloLink, setTituloLink] = useState("");
  const [urlLink, setUrlLink] = useState("");
  const [enviandoLink, setEnviandoLink] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await fetch("/api/materiais");
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error(dados.erro || "Falha ao carregar.");
      setMateriais(dados.materiais || []);
    } catch (e: any) {
      setErro(e?.message || "Não foi possível carregar os materiais.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo || !titulo.trim() || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const form = new FormData();
      form.append("file", arquivo);
      form.append("bucket", "materiais");
      form.append("titulo", titulo.trim());
      const resp = await fetch("/api/upload", { method: "POST", body: form });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error(dados.erro || "Falha ao publicar.");
      setTitulo("");
      setArquivo(null);
      await carregar();
    } catch (e: any) {
      setErro(e?.message || "Não foi possível publicar o material.");
    } finally {
      setEnviando(false);
    }
  };

  const handlePublicarLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloLink.trim() || !urlLink.trim() || enviandoLink) return;
    setEnviandoLink(true);
    setErro(null);
    try {
      const resp = await fetch("/api/materiais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: tituloLink.trim(), url: urlLink.trim() }),
      });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error(dados.erro || "Falha ao publicar.");
      setTituloLink("");
      setUrlLink("");
      await carregar();
    } catch (e: any) {
      setErro(e?.message || "Não foi possível publicar o link.");
    } finally {
      setEnviandoLink(false);
    }
  };

  const handleRemover = async (path: string) => {
    if (removendo || !confirm("Remover este material? Os alunos deixarão de vê-lo.")) return;
    setRemovendo(path);
    setErro(null);
    try {
      const resp = await fetch("/api/materiais", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const dados = await resp.json();
      if (!dados.sucesso) throw new Error(dados.erro || "Falha ao remover.");
      await carregar();
    } catch (e: any) {
      setErro(e?.message || "Não foi possível remover o material.");
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <div style={{ marginBottom: "var(--espaco-lg)" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Materiais de Apoio</h1>
        <p style={{ color: "var(--cor-muted)" }}>
          Publique documentos, roteiros e minutas que aparecem no dashboard do mentorado.
        </p>
      </div>

      {erro && (
        <p role="alert" style={{ color: "#991b1b", backgroundColor: "#fef2f2", padding: "10px 14px", borderRadius: "var(--radius-xs)", marginBottom: "var(--espaco-md)", fontSize: "13px" }}>
          {erro}
        </p>
      )}

      <form onSubmit={handlePublicar} className="card" style={{ marginBottom: "var(--espaco-lg)", display: "flex", gap: "var(--espaco-md)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "2 1 240px", fontSize: "13px", fontWeight: 600 }}>
          Título do material
          <input
            className="adm-input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Contrato Modelo de Parceria"
            maxLength={120}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px", fontSize: "13px", fontWeight: 600 }}>
          Arquivo (PDF, PNG, JPG, ZIP até 25 MB)
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.zip"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={!arquivo || !titulo.trim() || enviando}>
          {enviando ? "Publicando..." : "+ Publicar"}
        </button>
      </form>

      <form onSubmit={handlePublicarLink} className="card" style={{ marginBottom: "var(--espaco-lg)", display: "flex", gap: "var(--espaco-md)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px", fontSize: "13px", fontWeight: 600 }}>
          Título do link
          <input
            className="adm-input"
            value={tituloLink}
            onChange={(e) => setTituloLink(e.target.value)}
            placeholder="Ex: Planilha de precificação"
            maxLength={120}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "2 1 280px", fontSize: "13px", fontWeight: 600 }}>
          URL (http/https)
          <input
            className="adm-input"
            value={urlLink}
            onChange={(e) => setUrlLink(e.target.value)}
            placeholder="https://..."
            inputMode="url"
          />
        </label>
        <button type="submit" className="btn-primary" disabled={!tituloLink.trim() || !urlLink.trim() || enviandoLink}>
          {enviandoLink ? "Publicando..." : "+ Publicar link"}
        </button>
      </form>

      <div className="card">
        {carregando ? (
          <EstadoCarregando texto="os materiais" variante="tabela" />
        ) : materiais.length === 0 ? (
          <p style={{ color: "var(--cor-muted)", fontSize: "13px" }}>Nenhum material publicado ainda.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
                <th style={{ padding: "12px 8px" }}>Título</th>
                <th style={{ padding: "12px 8px" }}>Tipo</th>
                <th style={{ padding: "12px 8px" }}>Tamanho</th>
                <th style={{ padding: "12px 8px" }}><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {materiais.map((mat) => (
                <tr key={mat.path} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
                  <td style={{ padding: "14px 8px", fontWeight: 500 }}>{mat.titulo}</td>
                  <td style={{ padding: "14px 8px", fontFamily: "var(--font-family-mono)", fontSize: "13px" }}>.{mat.tipo}</td>
                  <td style={{ padding: "14px 8px" }}>{mat.tamanho}</td>
                  <td style={{ padding: "14px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <a
                      href={mat.downloadUrl}
                      className="btn-secondary btn-sm"
                      style={{ textDecoration: "none", marginRight: "8px" }}
                      {...(mat.tipo === "LINK" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {mat.tipo === "LINK" ? "Abrir" : "Baixar"}
                    </a>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => handleRemover(mat.path)}
                      disabled={removendo === mat.path}
                    >
                      {removendo === mat.path ? "Removendo..." : "Remover"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
