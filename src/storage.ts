import { defaultData } from "./defaults";
import type { AppData } from "./types";

const KEY = "sci-ugred-profesional-v2";

export function isValidAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AppData>;
  return Boolean(data.incident && Array.isArray(data.resources) && Array.isArray(data.patients) && Array.isArray(data.tasks) && Array.isArray(data.timeline));
}

export function loadLocal(): AppData {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null") as unknown;
    return isValidAppData(parsed) ? parsed : defaultData;
  } catch {
    return defaultData;
  }
}

export function saveLocal(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}
