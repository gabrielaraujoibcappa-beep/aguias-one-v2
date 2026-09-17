import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSAO, ehEquipe, resolverPerfil } from "@/lib/auth/sessao-core";

export const dynamic = "force-dynamic";

/**
 * Entrada do sistema: não tem tela própria. Sem sessão válida vai para o login;
 * com sessão, vai para a área do papel (a mesma decisão do middleware).
 */
export default async function HomePage() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const perfil = await resolverPerfil(token).catch(() => null);

  if (!perfil) redirect("/login");
  if (perfil.papel === "resgate") redirect("/resgate");
  redirect(ehEquipe(perfil.papel) ? "/painel/turma" : "/dashboard");
}
