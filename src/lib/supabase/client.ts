import { createClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_* são embutidas no build: mudar a variável na Vercel exige novo deploy (sem cache).
const urlConfigurada = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonConfigurada = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if ((!urlConfigurada || !anonConfigurada) && process.env.NODE_ENV === "production") {
  console.error(
    "[Supabase] NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes neste build. " +
      "Configure-as no provedor de hospedagem e faça um novo deploy sem cache. O login não funcionará."
  );
}

// Fallback local apenas para desenvolvimento/testes com `supabase start`
const supabaseUrl = urlConfigurada || "http://127.0.0.1:54321";
const supabaseAnonKey = anonConfigurada || "dummy-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
