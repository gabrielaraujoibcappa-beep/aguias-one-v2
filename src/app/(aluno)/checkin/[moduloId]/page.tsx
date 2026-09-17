"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { FormularioCheckinModular } from "@/components/checkin/FormularioCheckinModular";
import { SubmissaoCheckin } from "@/lib/api/checkin";
import { ModuloItem, filtrarModulosVisiveis } from "@/lib/api/modulos-liberacao";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

/**
 * Aceita o id real do módulo (UUID) ou "mod-N" (número do módulo), formato dos
 * links do menu e da busca. Sem módulo explícito, usa o último liberado.
 */
function localizarModulo(modulos: ModuloItem[], parametro: string | undefined): ModuloItem | undefined {
  const visiveis = filtrarModulosVisiveis(modulos);
  if (parametro) {
    const porId = visiveis.find((m) => m.id === parametro);
    if (porId) return porId;
    const numero = parametro.match(/^mod-(\d+)$/)?.[1];
    if (numero) {
      const porNumero = visiveis.find((m) => m.numero === Number(numero));
      if (porNumero) return porNumero;
    }
  }
  return visiveis[visiveis.length - 1];
}

export default function CheckinModuloPage() {
  const params = useParams();
  const router = useRouter();
  const { estado, carregado, submeterCheckin } = useSistemaStore();

  if (!carregado) return <EstadoCarregando texto="o check-in do módulo" variante="formulario" />;

  const parametro = Array.isArray(params?.moduloId) ? params.moduloId[0] : (params?.moduloId as string | undefined);
  const modulo = localizarModulo(estado.modulos, parametro);

  const voltar = (
    <button
      onClick={() => router.push("/dashboard")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        color: "var(--cor-muted)",
        fontSize: "14px",
        marginBottom: "var(--espaco-md)",
        fontWeight: 500,
      }}
    >
      ← Voltar ao Dashboard
    </button>
  );

  if (!modulo) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
        {voltar}
        <div className="card">
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Nenhum módulo liberado</h1>
          <p style={{ color: "var(--cor-muted)" }}>
            Os check-ins ficam disponíveis quando a equipe libera um módulo para a sua turma.
          </p>
        </div>
      </div>
    );
  }

  const handleEnviar = (submissao: SubmissaoCheckin) =>
    submeterCheckin({
      id: `local-${Date.now()}`,
      alunoNome: estado.usuarioAtual.nome,
      alunoEmail: estado.usuarioAtual.email || undefined,
      moduloTitulo: `Módulo ${modulo.numero} — ${modulo.titulo}`,
      links: submissao.links.filter((l) => l.url.trim() !== ""),
      arquivos: submissao.arquivos,
      travou: submissao.travou || undefined,
      duvidaCall: submissao.duvidaCall || undefined,
      status: "aguardando_avaliacao",
      enviadoEm: new Date().toISOString(),
    }, modulo.id);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      {voltar}
      <FormularioCheckinModular
        moduloId={modulo.id}
        moduloTitulo={modulo.titulo}
        itensRoteiro={modulo.itensRoteiro}
        onEnviar={handleEnviar}
      />
    </div>
  );
}
