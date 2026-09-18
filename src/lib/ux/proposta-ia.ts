/**
 * Máquina de estados da revisão de resultado de IA (Câmara UX).
 * O texto permanece proposta até a pessoa aceitar. Edição é local;
 * aceitar não envia, publica nem grava sozinho.
 */

export type FaseProposta = "proposta" | "editando" | "aceita" | "descartada";

export interface EstadoProposta {
  fase: FaseProposta;
  texto: string;
  textoOriginal: string;
  textoAntesEdicao: string | null;
  textoAntesAceite: string | null;
}

export type AcaoProposta =
  | { tipo: "receber"; texto: string }
  | { tipo: "aceitar" }
  | { tipo: "iniciarEdicao" }
  | { tipo: "salvarEdicao"; texto: string }
  | { tipo: "cancelarEdicao" }
  | { tipo: "descartar" }
  | { tipo: "desfazer" };

export function estadoInicialProposta(texto: string): EstadoProposta {
  return {
    fase: "proposta",
    texto,
    textoOriginal: texto,
    textoAntesEdicao: null,
    textoAntesAceite: null,
  };
}

export function reduzirProposta(estado: EstadoProposta, acao: AcaoProposta): EstadoProposta {
  switch (acao.tipo) {
    case "receber":
      return estadoInicialProposta(acao.texto);
    case "aceitar":
      if (estado.fase === "descartada" || estado.fase === "aceita") return estado;
      return {
        ...estado,
        fase: "aceita",
        textoAntesAceite: estado.texto,
      };
    case "iniciarEdicao":
      if (estado.fase === "descartada") return estado;
      return {
        ...estado,
        fase: "editando",
        textoAntesEdicao: estado.texto,
      };
    case "salvarEdicao":
      if (estado.fase !== "editando") return estado;
      return {
        ...estado,
        fase: "proposta",
        texto: acao.texto,
        textoAntesEdicao: null,
      };
    case "cancelarEdicao":
      if (estado.fase !== "editando") return estado;
      return {
        ...estado,
        fase: "proposta",
        texto: estado.textoAntesEdicao ?? estado.texto,
        textoAntesEdicao: null,
      };
    case "descartar":
      if (estado.fase === "aceita") return estado;
      return {
        ...estado,
        fase: "descartada",
        textoAntesEdicao: null,
      };
    case "desfazer":
      if (estado.fase === "aceita" && estado.textoAntesAceite != null) {
        return {
          ...estado,
          fase: "proposta",
          texto: estado.textoAntesAceite,
          textoAntesAceite: null,
        };
      }
      if (estado.fase === "descartada") {
        return {
          ...estado,
          fase: "proposta",
        };
      }
      return estado;
    default:
      return estado;
  }
}
