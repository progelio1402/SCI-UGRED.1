import type { Incident, LogEntry, Resource, Task } from "./types";
import { defaultIncident, defaultLog, defaultResources, defaultTasks } from "./defaults";

const KEY = "ugred-tablero-v1";

export interface AppData {
  incident: Incident;
  resources: Resource[];
  tasks: Task[];
  log: LogEntry[];
}

export function loadLocal(): AppData {
  const raw = localStorage.getItem(KEY);
  if (!raw) return {
    incident: defaultIncident,
    resources: defaultResources,
    tasks: defaultTasks,
    log: defaultLog
  };
  try {
    return JSON.parse(raw) as AppData;
  } catch {
    return {
      incident: defaultIncident,
      resources: defaultResources,
      tasks: defaultTasks,
      log: defaultLog
    };
  }
}

export function saveLocal(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
