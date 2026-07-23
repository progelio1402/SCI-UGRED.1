export type AlertLevel = "VERDE" | "AMARILLO" | "ROJO";

export type IncidentStatus =
  | "Activo"
  | "En monitoreo"
  | "Cerrado";

export type ResourceStatus =
  | "Disponible"
  | "Asignado"
  | "En tránsito"
  | "En operación"
  | "Fuera de servicio"
  | "Liberado";

export type ResourceType =
  | "Personal"
  | "Vehículo"
  | "Equipo"
  | "Comunicaciones"
  | "Insumo";

export type PatientSex =
  | "Femenino"
  | "Masculino"
  | "Intersex"
  | "No informado";

export type LifeCycle =
  | "Infancia"
  | "Adolescencia"
  | "Adulto"
  | "Persona mayor"
  | "Gestante"
  | "No informado";

export type PatientCondition =
  | "Evaluado"
  | "En observación"
  | "Traslado"
  | "Hospitalizado"
  | "Alta en terreno"
  | "Fallecido";

export type TaskStatus =
  | "Pendiente"
  | "En curso"
  | "Cumplida";

export type Priority =
  | "Alta"
  | "Media"
  | "Baja";

export interface Incident {
  id: string;
  name: string;
  type: string;
  location: string;
  startedAt: string;
  level: AlertLevel;
  status: IncidentStatus;
  commander: string;
  deputy: string;
  objective: string;
  situation: string;
  risks: string;
  criticalServices: string;
}

export interface Resource {
  id: string;
  code: string;
  name: string;
  type: ResourceType;
  role: string;
  responsible: string;
  location: string;
  assignment: string;
  quantity: number;
  status: ResourceStatus;
  updatedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  rut: string;
  sex: PatientSex;
  lifeCycle: LifeCycle;
  condition: PatientCondition;
  destination: string;
  observations: string;
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

export interface TimelineEntry {
  id: string;
  createdAt: string;
  category:
    | "Activación"
    | "Operaciones"
    | "Salud"
    | "Logística"
    | "Comunicaciones"
    | "Decisión";
  description: string;
  author: string;
}

export interface LogEntry {
  id: string;
  createdAt: string;
  description: string;
}

export interface AppData {
  incident: Incident;
  resources: Resource[];
  patients: Patient[];
  tasks: Task[];
  timeline: TimelineEntry[];
}
