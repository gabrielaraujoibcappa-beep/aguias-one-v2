import React from "react";

export interface ItemBarra {
  chave: string;
  rotulo: string;
  valor: number;
}

interface BarrasHorizontaisProps {
  titulo: string;
  itens: ItemBarra[];
  /** Base do percentual exibido ao lado da contagem (ex.: total de respondentes). */
  total?: number;
  sufixo?: string;
  /** Escala máxima; padrão = maior valor. Use 100 para percentuais. */
  maximo?: number;
}

/**
 * Magnitude de uma única série: um tom (azul de ação), barras finas ancoradas à
 * esquerda, rótulo e valor em tinta de texto. Sem legenda (série única).
 */
export function BarrasHorizontais({ titulo, itens, total, sufixo = "", maximo }: BarrasHorizontaisProps) {
  const escala = maximo ?? Math.max(1, ...itens.map((i) => i.valor));
  const ordenados = [...itens].sort((a, b) => b.valor - a.valor);

  return (
    <figure style={{ margin: 0 }}>
      <figcaption style={{ fontSize: "13px", fontWeight: 700, color: "var(--cor-ink)", marginBottom: "10px" }}>
        {titulo}
      </figcaption>
      {ordenados.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--cor-muted)", margin: 0 }}>Sem respostas.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {ordenados.map((item) => {
            const largura = Math.max(0, Math.min(100, (item.valor / escala) * 100));
            const pct = total ? Math.round((item.valor / total) * 100) : null;
            const valorTexto = `${item.valor}${sufixo}${pct !== null ? ` · ${pct}%` : ""}`;
            return (
              <li key={item.chave} title={`${item.rotulo}: ${valorTexto}`}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    fontSize: "12px",
                    marginBottom: "3px",
                  }}
                >
                  <span style={{ color: "var(--cor-text-muted)", minWidth: 0, overflowWrap: "anywhere" }}>{item.rotulo}</span>
                  <span style={{ color: "var(--cor-ink)", fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {valorTexto}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  style={{ height: "8px", backgroundColor: "var(--cor-soft-stone)", borderRadius: "4px", overflow: "hidden" }}
                >
                  <div
                    style={{
                      width: `${largura}%`,
                      height: "100%",
                      backgroundColor: "var(--cor-action-vibrant)",
                      borderRadius: "0 4px 4px 0",
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}

/** Contagem { valor: n } → itens de barra com rótulo resolvido. */
export function paraItens(contagem: Record<string, number> | undefined, rotular: (chave: string) => string): ItemBarra[] {
  return Object.entries(contagem ?? {}).map(([chave, valor]) => ({
    chave,
    valor,
    rotulo: chave === "sem_resposta" ? "Sem resposta" : rotular(chave),
  }));
}
