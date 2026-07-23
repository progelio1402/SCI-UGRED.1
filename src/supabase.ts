import { createClient } from "@supabase/supabase-js";
import type { AppData } from "./storage";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);
export const supabase = supabaseConfigured ? createClient(url, key) : null;

export async function loadRemote(): Promise<AppData | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_state")
    .select("payload")
    .eq("id", "principal")
    .maybeSingle();
  if (error) throw error;
  return data?.payload as AppData | null;
}

export async function saveRemote(payload: AppData): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("app_state")
    .upsert({ id: "principal", payload, updated_at: new Date().toISOString() });
  if (error) throw error;
}
