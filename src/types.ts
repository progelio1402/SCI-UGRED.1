export type IncidentLevel = "VERDE" | "AMARILLO" | "ROJO";
export type IncidentStatus = "Activo" | "Cerrado";
export type ResourceType = "Vehículo" | "Personal" | "Equipo" | "Comunicaciones" | "Insumo";
export type ResourceStatus = "Disponible" | "Asignado" | "En tránsito" | "En operación" | "Fuera de servicio" | "Liberado";
export type TaskStatus = "Pendiente" | "En curso" | "Cumplida";
export type Priority = "Alta" | "Media" | "Baja";

export interface Incident {
  id: string;
  name: string;
  type: string;
  location: string;
  detail: string;
  objective: string;
  situation: string;
  risks: string;
  criticalServices: string;
  level: IncidentLevel;
  status: IncidentStatus;
  commander: string;
  startedAt: string;
  evaluated: number;
  injured: number;
  transferred: number;
  isolated: number;
}

export interface Resource {
  id: string;
  code: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  responsible: string;
  location: string;
  assignment: string;
  quantity: number;
  updatedAt: string;
}

export interface Task {
  id: string;
  objective: string;
  action: string;
  responsible: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string;
}

export interface LogEntry {
  id: string;
  createdAt: string;
  description: string;
}
