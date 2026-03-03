import { createClient } from '@supabase/supabase-js';

// On récupère les clés depuis notre fichier .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// On vérifie que les clés sont bien là (sécurité)
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Il manque les variables d'environnement Supabase !");
}

// On crée et on exporte notre "téléphone" pour appeler Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);