import type { AppData } from "./types";

const now = new Date();
const started = new Date(now.getTime() - 1000 * 60 * 78);

export const defaultData: AppData = {
  incident: {
    id: crypto.randomUUID(),
    name: "Evento hidrometeorológico",
    type: "Emergencia comunal",
    location: "San José de Maipo",
    startedAt: started.toISOString().slice(0, 16),
    level: "AMARILLO",
    status: "Activo",
    commander: "Rodrigo Véliz",
    deputy: "Esteban Aguilera",
    objective: "Proteger la vida, asegurar continuidad operativa y mantener coordinación sanitaria comunal.",
    situation: "Precipitaciones intensas con afectación parcial de rutas y vigilancia reforzada de establecimientos rurales.",
    risks: "Aislamiento territorial, interrupción eléctrica, dificultad de acceso y aumento de demanda asistencial.",
    criticalServices: "Postas rurales operativas con vigilancia de energía, agua, comunicaciones y accesibilidad."
  },
  resources: [
    { id: crypto.randomUUID(), code: "CI-01", name: "Comandante del Incidente", type: "Personal", role: "Comando", responsible: "Rodrigo Véliz", location: "Puesto de comando", assignment: "Dirección estratégica y coordinación", quantity: 1, status: "En operación", updatedAt: now.toISOString() },
    { id: crypto.randomUUID(), code: "SC-01", name: "Subrogancia de Comando", type: "Personal", role: "Comando", responsible: "Esteban Aguilera", location: "Puesto de comando", assignment: "Apoyo al mando y seguridad", quantity: 1, status: "Asignado", updatedAt: now.toISOString() },
    { id: crypto.randomUUID(), code: "MED-01", name: "Médico regulador APS", type: "Personal", role: "Operaciones clínicas", responsible: "Felipe Olivares", location: "Red comunal", assignment: "Evaluación clínica y coordinación de traslados", quantity: 1, status: "Disponible", updatedAt: now.toISOString() },
    { id: crypto.randomUUID(), code: "AMB-01", name: "Ambulancia básica", type: "Vehículo", role: "Transporte sanitario", responsible: "Equipo de turno", location: "PSR Las Vertientes", assignment: "Respuesta y traslado", quantity: 1, status: "Disponible", updatedAt: now.toISOString() },
    { id: crypto.randomUUID(), code: "UGR-4X4", name: "Camioneta UGRED 4x4", type: "Vehículo", role: "Reconocimiento y logística", responsible: "Esteban Aguilera", location: "Ruta G-25", assignment: "Evaluación de accesibilidad", quantity: 1, status: "En tránsito", updatedAt: now.toISOString() },
    { id: crypto.randomUUID(), code: "RAD-01", name: "Radio portátil", type: "Comunicaciones", role: "Enlace operativo", responsible: "Tomás Surhoff", location: "Puesto de comando", assignment: "Red de comunicaciones", quantity: 4, status: "En operación", updatedAt: now.toISOString() },
    { id: crypto.randomUUID(), code: "GEN-01", name: "Generador 5 kVA", type: "Equipo", role: "Respaldo eléctrico", responsible: "Carlos Celis", location: "Bodega UGRED", assignment: "Disponible para despliegue", quantity: 1, status: "Disponible", updatedAt: now.toISOString() }
  ],
  patients: [],
  tasks: [
    { id: crypto.randomUUID(), objective: "Verificar continuidad de la red", action: "Confirmar estado operativo de cada posta rural", responsible: "Gonzalo Duarte", priority: "Alta", status: "En curso", deadline: "" },
    { id: crypto.randomUUID(), objective: "Mantener comunicación", action: "Emitir actualización operacional cada 60 minutos", responsible: "Tomás Surhoff", priority: "Media", status: "Pendiente", deadline: "" }
  ],
  timeline: [
    { id: crypto.randomUUID(), createdAt: started.toISOString(), category: "Activación", description: "Se activa tablero SCI UGRED por evento hidrometeorológico.", author: "Comando" },
    { id: crypto.randomUUID(), createdAt: new Date(started.getTime() + 12 * 60000).toISOString(), category: "Comunicaciones", description: "Contacto establecido con establecimientos rurales.", author: "Comunicaciones" },
    { id: crypto.randomUUID(), createdAt: new Date(started.getTime() + 25 * 60000).toISOString(), category: "Operaciones", description: "Camioneta UGRED inicia reconocimiento de ruta G-25.", author: "Operaciones" }
  ]
};
