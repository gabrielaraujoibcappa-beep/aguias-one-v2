import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "ÁGUIAS ONE — Sistema de Mentoria",
  description: "Sistema de Gestão Estratégica e Acompanhamento de Negócios Periciais — IBCAPPA",
  icons: {
    icon: "/logo-simbolo.png",
    shortcut: "/logo-simbolo.png",
    apple: "/logo-simbolo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/logo-simbolo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Extensões do navegador injetam atributos no <body> antes da hidratação */}
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
