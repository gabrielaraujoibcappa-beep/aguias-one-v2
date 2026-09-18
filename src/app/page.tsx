import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSAO, ehEquipe, resolverPerfil } from "@/lib/auth/sessao-core";
import { PortaEntrada } from "@/components/PortaEntrada";

export const dynamic = "force-dynamic";

/**
 * Porta pública do sistema. Sem sessão mostra o lobby de entrada;
 * com sessão, segue para a área do papel (a mesma decisão do middleware).
 */
export default async function HomePage() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const perfil = await resolverPerfil(token).catch(() => null);

  if (!perfil) return <PortaEntrada />;
  if (perfil.papel === "resgate") redirect("/resgate");
  redirect(ehEquipe(perfil.papel) ? "/painel/turma" : "/dashboard");
}
