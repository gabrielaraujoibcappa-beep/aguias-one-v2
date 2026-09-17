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
  metadataBase: new URL("https://mentoria.one.axelpro.com.br"),
  title: "ÁGUIAS ONE — Sistema de Mentoria",
  description: "Sistema de Gestão Estratégica e Acompanhamento de Negócios Periciais — UniBCAPPA",
  icons: {
    icon: "/logo-simbolo.png",
    shortcut: "/logo-simbolo.png",
    apple: "/logo-simbolo.png",
  },
  openGraph: {
    title: "ÁGUIAS ONE — Mentoria Pericial de Alta Performance",
    description: "Sistema de Gestão Estratégica e Acompanhamento de Negócios Periciais — UniBCAPPA",
    url: "https://mentoria.one.axelpro.com.br",
    siteName: "ÁGUIAS ONE",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 675,
        alt: "ÁGUIAS ONE — Mentoria Pericial de Alta Performance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ÁGUIAS ONE — Mentoria Pericial de Alta Performance",
    description: "Sistema de Gestão Estratégica e Acompanhamento de Negócios Periciais — UniBCAPPA",
    images: ["/og-image.jpg"],
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
