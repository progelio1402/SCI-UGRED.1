export type ResourceStatus =
  | "Disponible"
  | "Asignado"
  | "En tránsito"
  | "En operación"
  | "Fuera de servicio"
  | "Liberado";

export interface Resource {
  id: string;
  code: string;
  name: string;
  type: "Vehículo" | "Personal" | "Equipo" | "Comunicaciones" | "Otro";
  status: ResourceStatus;
  responsible: string;
  location: string;
  assignment: string;
  quantity: number;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  time: string;
  description: string;
}
