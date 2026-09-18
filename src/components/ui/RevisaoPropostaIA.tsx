"use client";

import React, { useEffect, useId, useReducer, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import {
  estadoInicialProposta,
  reduzirProposta,
  type EstadoProposta,
} from "@/lib/ux/proposta-ia";

export interface RevisaoPropostaIAProps {
  /** Texto proposto pela IA. Nova string substitui a proposta atual. */
  texto: string;
  /** Rótulo visível do campo quando a pessoa edita. */
  rotuloCampo?: string;
  /** Origem anunciada (não substitui o conteúdo). */
  origem?: string;
  /** Aceitar a proposta no contexto — não envia nem publica sozinho. */
  onAceitar?: (texto: string) => void;
  /** Descarte da sugestão, sem aplicar. */
  onDescartar?: () => void;
  /** Pedido de outra versão. A nova proposta chega por `texto`. */
  onGerarOutra?: () => void;
  /** A IA está gerando outra versão. */
  gerando?: boolean;
}

function mensagemStatus(estado: EstadoProposta): string {
  switch (estado.fase) {
    case "proposta":
      return "Proposta de IA pronta para revisão.";
    case "editando":
      return "Editando a proposta. Salve a edição ou cancele para voltar ao texto anterior.";
    case "aceita":
      return "Proposta aceita neste contexto. Enviar ou publicar pede confirmação à parte.";
    case "descartada":
      return "Sugestão descartada. Nada foi aplicado.";
    default:
      return "";
  }
}

/**
 * Revisão de resultado de IA (Câmara UX): a saída fica como proposta até
 * aceitar, editar, gerar outra ou descartar. Aceitar ≠ enviar/publicar.
 */
export function RevisaoPropostaIA({
  texto,
  rotuloCampo = "Texto da proposta",
  origem = "Gerado por IA — proposta, não conteúdo final",
  onAceitar,
  onDescartar,
  onGerarOutra,
  gerando = false,
}: RevisaoPropostaIAProps) {
  const rotuloId = useId();
  const campoId = useId();
  const statusId = useId();
  const [estado, despachar] = useReducer(reduzirProposta, texto, estadoInicialProposta);
  const [rascunho, setRascunho] = useState(texto);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const recuperarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    despachar({ tipo: "receber", texto });
    setRascunho(texto);
  }, [texto]);

  useEffect(() => {
    if (estado.fase === "editando") campoRef.current?.focus();
    if (estado.fase === "descartada") recuperarRef.current?.focus();
  }, [estado.fase]);

  const aceitar = () => {
    despachar({ tipo: "aceitar" });
    onAceitar?.(estado.texto);
  };

  const descartar = () => {
    despachar({ tipo: "descartar" });
    onDescartar?.();
  };

  return (
    <section
      className="proposta-ia"
      aria-labelledby={rotuloId}
      aria-describedby={statusId}
      data-fase={estado.fase}
    >
      <header className="proposta-ia-topo">
        <p id={rotuloId} className="proposta-ia-origem">
          {origem}
        </p>
        <p id={statusId} className="proposta-ia-status" role="status" aria-live="polite">
          {mensagemStatus(estado)}
        </p>
      </header>

      {estado.fase === "descartada" ? (
        <ButtonGroup alinhamento="esquerda" ariaLabel="Recuperar sugestão descartada">
          <Button ref={recuperarRef} variante="secundario" onClick={() => despachar({ tipo: "desfazer" })}>
            Trazer sugestão de volta
          </Button>
        </ButtonGroup>
      ) : estado.fase === "editando" ? (
        <>
          <div className="proposta-ia-campo">
            <label htmlFor={campoId}>{rotuloCampo}</label>
            <textarea
              ref={campoRef}
              id={campoId}
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
              rows={8}
            />
          </div>
          <ButtonGroup alinhamento="esquerda" ariaLabel="Ações da edição da proposta">
            <Button
              variante="primario"
              onClick={() => despachar({ tipo: "salvarEdicao", texto: rascunho })}
            >
              Salvar edição
            </Button>
            <Button variante="secundario" onClick={() => despachar({ tipo: "cancelarEdicao" })}>
              Cancelar edição
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          <div className="proposta-ia-corpo">{estado.texto}</div>
          {estado.fase === "aceita" ? (
            <ButtonGroup alinhamento="esquerda" ariaLabel="Desfazer aceite da proposta">
              <Button variante="secundario" onClick={() => despachar({ tipo: "desfazer" })}>
                Desfazer aceite
              </Button>
            </ButtonGroup>
          ) : (
            <ButtonGroup alinhamento="esquerda" ariaLabel="Revisar proposta gerada por IA">
              <Button variante="primario" onClick={aceitar}>
                Aceitar proposta
              </Button>
              <Button variante="secundario" onClick={() => {
                setRascunho(estado.texto);
                despachar({ tipo: "iniciarEdicao" });
              }}>
                Editar
              </Button>
              {onGerarOutra && (
                <Button
                  variante="terciario"
                  onClick={onGerarOutra}
                  carregando={gerando}
                  textoCarregando="Gerando outra…"
                >
                  Gerar outra
                </Button>
              )}
              <Button variante="terciario" onClick={descartar}>
                Descartar sugestão
              </Button>
            </ButtonGroup>
          )}
        </>
      )}
    </section>
  );
}
