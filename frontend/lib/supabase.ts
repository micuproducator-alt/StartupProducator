import { createClient } from "@supabase/supabase-js";

// Definim variabilele cu un string gol ca fallback dacă nu sunt încărcate
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Lipsește configurarea Supabase în fișierul .env!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
