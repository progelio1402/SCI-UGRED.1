import type { LogEntry, Resource } from "./types";

export const initialResources: Resource[] = [
  {
    id: "1",
    code: "A-01",
    name: "Ambulancia básica",
    type: "Vehículo",
    role: "Respuesta sanitaria y traslado",
    status: "En operación",
    responsible: "Felipe Olivares",
    location: "Ruta a San Gabriel",
    assignment: "Evaluación y traslado preventivo",
    quantity: 1,
    updatedAt: new Date().toISOString()
  },
  {
    id: "2",
    code: "V-01",
    name: "Camioneta UGRED 4x4",
    type: "Vehículo",
    role: "Reconocimiento y apoyo operativo",
    status: "En tránsito",
    responsible: "Esteban Aguilera",
    location: "Sector Baños Morales",
    assignment: "Reconocimiento de ruta",
    quantity: 1,
    updatedAt: new Date().toISOString()
  },
  {
    id: "3",
    code: "RAD-03",
    name: "Radio portátil",
    type: "Comunicaciones",
    role: "Enlace de comunicaciones",
    status: "Disponible",
    responsible: "Tomás Surhoff",
    location: "Puesto de comando",
    assignment: "Comunicaciones operativas",
    quantity: 1,
    updatedAt: new Date().toISOString()
  },
  {
    id: "4",
    code: "GEN-01",
    name: "Generador 5 kVA",
    type: "Equipo",
    role: "Respaldo de energía",
    status: "Asignado",
    responsible: "Carlos Celis",
    location: "PSR San Gabriel",
    assignment: "Respaldo eléctrico",
    quantity: 1,
    updatedAt: new Date().toISOString()
  }
];

function todayAt(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const initialLog: LogEntry[] = [
  {
    id: "1",
    createdAt: todayAt(14, 5),
    description: "Se activa UGRED por evento de aluvión en San Gabriel."
  },
  {
    id: "2",
    createdAt: todayAt(14, 12),
    description: "Contacto establecido con equipo de la PSR San Gabriel."
  },
  {
    id: "3",
    createdAt: todayAt(14, 20),
    description: "Se despacha camioneta UGRED hacia el sector afectado."
  },
  {
    id: "4",
    createdAt: todayAt(14, 31),
    description: "Ruta G-25 interrumpida en km 42 por arrastre de material."
  }
];
