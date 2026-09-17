import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

// Servidas pelo próprio domínio: sem ida ao Google Fonts bloqueando a primeira pintura
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--fonte-ui",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--fonte-display",
});

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
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      {/* Extensões do navegador injetam atributos no <body> antes da hidratação */}
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
