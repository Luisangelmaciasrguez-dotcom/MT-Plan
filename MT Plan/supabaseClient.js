import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las variables (por ejemplo, en local sin configurar), la app
// mostrará un aviso en la pantalla de contraseña en lugar de romperse.
export const supabase = url && key ? createClient(url, key) : null;
