
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bnvmvwsjlpytmhcfdwer.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudm12d3NqbHB5dG1oY2Zkd2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzIwMTEsImV4cCI6MjA4NDQwODAxMX0.i2tB3VgqB_Ej6p_DoW4Ks4eXRxxsAgb3q0ub9Ma5Jao';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('YOUR_'));

if (!isSupabaseConfigured) {
  console.warn("Supabase is not fully configured. Application will run in Demo Mode with local storage.");
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
