import { createClient } from "@supabase/supabase-js";
import type { AppData } from "./storage";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

export const supabase = supabaseConfigured
  ? createClient(url, key)
  : null;

function isValidAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Partial<AppData>;

  return Boolean(
    data.incident &&
    typeof data.incident === "object" &&
    Array.isArray(data.resources) &&
    Array.isArray(data.tasks) &&
    Array.isArray(data.log)
  );
}

export async function loadRemote(): Promise<AppData | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_state")
    .select("payload")
    .eq("id", "principal")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!isValidAppData(data?.payload)) {
    return null;
  }

  return data.payload;
}

export async function saveRemote(
  payload: AppData
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("app_state")
    .upsert({
      id: "principal",
      payload,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw error;
  }
}
