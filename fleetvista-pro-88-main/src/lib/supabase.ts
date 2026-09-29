import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

// A chave "anon" é pública por design; quem protege os dados é o RLS (ver supabase/schema.sql).
export const supabase = createClient(url ?? "https://placeholder.supabase.co", key ?? "placeholder", {
  auth: { persistSession: true, autoRefreshToken: true },
});

// O Supabase Auth exige e-mail. A tela pede "usuário" e convertemos para este domínio interno.
export const USER_EMAIL_DOMAIN = "frotaviva.app";
export const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@${USER_EMAIL_DOMAIN}`;
