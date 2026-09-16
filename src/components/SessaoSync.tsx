"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { gravarTokenSessao, obterUsuarioLogado } from "@/lib/auth/sessao-cliente";
import { useSistemaStore } from "@/lib/store/sistema-store";

const ROTAS_PUBLICAS = ["/", "/login", "/acesso-bloqueado"];

/**
 * Mantém o cookie de sessão em dia com as renovações de token do supabase-js
 * e alinha papel/nome exibidos na interface com o perfil validado no servidor.
 */
export function SessaoSync() {
  const pathname = usePathname();
  const { carregado, definirUsuarioLogado } = useSistemaStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) gravarTokenSessao(data.session.access_token, data.session.expires_in);
    });

    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (sessao && (evento === "SIGNED_IN" || evento === "TOKEN_REFRESHED")) {
        gravarTokenSessao(sessao.access_token, sessao.expires_in);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!carregado || ROTAS_PUBLICAS.includes(pathname ?? "")) return;
    let cancelado = false;
    obterUsuarioLogado().then((usuario: any) => {
      if (cancelado || !usuario) return;
      definirUsuarioLogado({
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        turmaNome: usuario.turma?.nome,
      });
    });
    return () => {
      cancelado = true;
    };
    // Revalida apenas ao trocar de área; definirUsuarioLogado é recriada a cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregado, pathname]);

  return null;
}
