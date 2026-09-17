import React from "react";
import Link from "next/link";

export default function PaginaNaoEncontrada() {
  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "var(--espaco-xxl) var(--espaco-lg)" }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-sm)" }}>
        <h1 style={{ fontSize: "22px", margin: 0 }}>Esta página não existe</h1>
        <p style={{ color: "var(--cor-muted)", fontSize: "14px", margin: 0 }}>
          O endereço pode ter mudado ou o link estar incompleto.
        </p>
        <div style={{ marginTop: "var(--espaco-sm)" }}>
          <Link href="/" className="btn-primary">
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
