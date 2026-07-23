import type { LogEntry, Resource } from "./types";

export const initialResources: Resource[] = [
  {
    id: "1",
    code: "A-01",
    name: "Ambulancia básica",
    type: "Vehículo",
    status: "En operación",
    responsible: "Felipe Olivares",
    location: "Ruta a San Gabriel",
    assignment: "Evaluación y traslado preventivo",
    quantity: 1,
    updatedAt: "14:45",
  },
  {
    id: "2",
    code: "V-01",
    name: "Camioneta UGRED 4x4",
    type: "Vehículo",
    status: "En tránsito",
    responsible: "Esteban Aguilera",
    location: "Sector Baños Morales",
    assignment: "Reconocimiento de ruta",
    quantity: 1,
    updatedAt: "14:46",
  },
  {
    id: "3",
    code: "RAD-03",
    name: "Radio portátil",
    type: "Comunicaciones",
    status: "Disponible",
    responsible: "Tomás Surhoff",
    location: "Puesto de comando",
    assignment: "Comunicaciones operativas",
    quantity: 1,
    updatedAt: "14:20",
  },
  {
    id: "4",
    code: "GEN-01",
    name: "Generador 5 kVA",
    type: "Equipo",
    status: "Asignado",
    responsible: "Carlos Celis",
    location: "PSR San Gabriel",
    assignment: "Respaldo eléctrico",
    quantity: 1,
    updatedAt: "14:32",
  },
];

export const initialLog: LogEntry[] = [
  { id: "1", time: "14:05", description: "Se activa UGRED por evento de aluvión en San Gabriel." },
  { id: "2", time: "14:12", description: "Contacto establecido con equipo de la PSR San Gabriel." },
  { id: "3", time: "14:20", description: "Se despacha camioneta UGRED hacia el sector afectado." },
  { id: "4", time: "14:31", description: "Ruta G-25 interrumpida en km 42 por arrastre de material." },
];
