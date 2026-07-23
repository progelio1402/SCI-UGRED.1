import type { Incident, LogEntry, Resource, Task } from "./types";

export const defaultIncident: Incident = {
  id: crypto.randomUUID(),
  name: "Nuevo incidente",
  type: "Emergencia comunal",
  location: "San José de Maipo",
  detail: "",
  objective: "Proteger la vida y mantener la continuidad de la red de salud.",
  situation: "Pendiente de evaluación inicial.",
  risks: "Sin riesgos registrados.",
  criticalServices: "Sin afectación informada.",
  level: "VERDE",
  status: "Activo",
  commander: "Rodrigo Véliz V.",
  startedAt: new Date().toISOString().slice(0, 16),
  evaluated: 0,
  injured: 0,
  transferred: 0,
  isolated: 0
};

export const defaultResources: Resource[] = [
  {
    id: crypto.randomUUID(),
    code: "AMB-01",
    name: "Ambulancia básica",
    type: "Vehículo",
    status: "Disponible",
    responsible: "Froilán Pinto",
    location: "PSR Las Vertientes",
    assignment: "Sin asignar",
    quantity: 1,
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    code: "RAD-01",
    name: "Radio portátil VHF",
    type: "Comunicaciones",
    status: "Disponible",
    responsible: "UGRED",
    location: "Puesto de comando",
    assignment: "Sin asignar",
    quantity: 4,
    updatedAt: new Date().toISOString()
  }
];

export const defaultTasks: Task[] = [];
export const defaultLog: LogEntry[] = [{
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  description: "Tablero iniciado."
}];
