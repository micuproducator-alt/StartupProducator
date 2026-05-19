import { createClient } from "@supabase/supabase-js";

// Folosim tipizarea "as any" pentru a opri eroarea de TypeScript cu .env
// până când se actualizează definițiile globale
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase nu este configurat! Verifica fisierul .env");
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
