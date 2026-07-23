import { useMemo, useState } from "react";
import {
  Activity,
  Ambulance,
  BadgeAlert,
  BookOpenText,
  ClipboardList,
  Plus,
  Radio,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { initialLog, initialResources } from "./data";
import type { LogEntry, Resource, ResourceStatus } from "./types";

const statuses: ResourceStatus[] = [
  "Disponible",
  "Asignado",
  "En tránsito",
  "En operación",
  "Fuera de servicio",
  "Liberado",
];

const staff = [
  ["Comandante del incidente", "Rodrigo Véliz V."],
  ["Oficial de seguridad", "Esteban Aguilera"],
  ["Oficial de enlace", "Carlos Celis"],
  ["Información pública", "Tomás Surhoff"],
  ["Operaciones", "Gonzalo Duarte"],
  ["Planificación", "Javiera Seguel"],
  ["Logística", "Jacqueline Román"],
  ["Administración / Finanzas", "Yeralding Aguilar"],
];

const tasks = [
  ["Evaluar situación en sector afectado", "Recorrido de evaluación inicial", "Gonzalo Duarte", "Alta", "En curso", "16:00"],
  ["Asegurar atención en postas", "Verificar funcionamiento y dotación", "Felipe Olivares", "Alta", "En curso", "15:30"],
  ["Restablecer conectividad", "Evaluar rutas alternativas", "Tomás Surhoff", "Media", "Pendiente", "17:00"],
  ["Habilitar albergue preventivo", "Coordinar con municipio", "Juana Valdés", "Media", "Pendiente", "18:00"],
];

function statusClass(status: ResourceStatus) {
  return `status status-${status.toLowerCase().replaceAll(" ", "-").replace("ó", "o")}`;
}

function iconFor(type: Resource["type"]) {
  if (type === "Vehículo") return <Truck size={24} />;
  if (type === "Comunicaciones") return <Radio size={24} />;
  if (type === "Personal") return <Users size={24} />;
  return <Wrench size={24} />;
}

export default function App() {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [log, setLog] = useState<LogEntry[]>(initialLog);
  const [filter, setFilter] = useState("Todos");
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState("");

  const visibleResources = useMemo(
    () => filter === "Todos" ? resources : resources.filter((r) => r.type === filter),
    [filter, resources],
  );

  function changeStatus(resource: Resource, status: ResourceStatus) {
    const now = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    setResources((current) =>
      current.map((item) =>
        item.id === resource.id ? { ...item, status, updatedAt: now } : item,
      ),
    );
    setLog((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        time: now,
        description: `${resource.code} cambió de “${resource.status}” a “${status}”.`,
      },
    ]);
  }

  function addResource(form: HTMLFormElement) {
    const data = new FormData(form);
    const now = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    const resource: Resource = {
      id: crypto.randomUUID(),
      code: String(data.get("code") || "REC"),
      name: String(data.get("name") || "Recurso eventual"),
      type: String(data.get("type")) as Resource["type"],
      status: "Asignado",
      responsible: String(data.get("responsible") || "Sin asignar"),
      location: String(data.get("location") || "Puesto de comando"),
      assignment: String(data.get("assignment") || "Pendiente de asignación"),
      quantity: Number(data.get("quantity") || 1),
      updatedAt: now,
    };
    setResources((current) => [...current, resource]);
    setLog((current) => [
      ...current,
      { id: crypto.randomUUID(), time: now, description: `Se incorpora ${resource.code} · ${resource.name}.` },
    ]);
    setShowResourceModal(false);
  }

  function addLogEntry() {
    if (!newLog.trim()) return;
    const now = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
    setLog((current) => [...current, { id: crypto.randomUUID(), time: now, description: newLog.trim() }]);
    setNewLog("");
    setShowLogModal(false);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <ShieldCheck size={42} />
          <div><strong>UGRED</strong><span>Depto. Salud · San José de Maipo</span></div>
        </div>
        <div className="title"><strong>TABLERO DE INCIDENTES</strong><span>Maleta de comando digital</span></div>
        <div className="top-metrics">
          <div><small>ESTADO</small><b className="red-pill">ACTIVO</b></div>
          <div><small>NIVEL</small><b className="red-pill">ROJO</b></div>
          <div><small>INICIO</small><b>22/07/2026 · 14:05</b></div>
          <div><small>COMANDANTE</small><b>Rodrigo Véliz V.</b></div>
        </div>
      </header>

      <main className="board">
        <section className="panel incident-panel">
          <div className="panel-title">INCIDENTE</div>
          <div className="incident-grid">
            <div><small>NOMBRE</small><strong>ALUVIÓN SECTOR SAN GABRIEL</strong><span>Aluvión / aislamiento</span></div>
            <div><small>UBICACIÓN</small><strong>San Gabriel, San José de Maipo</strong><span>Ruta G-25 · Baños Morales</span></div>
            <div><small>OBJETIVO GENERAL</small><strong>Proteger la vida, evaluar daños y mantener la continuidad de la red de salud.</strong></div>
          </div>
        </section>

        <section className="upper-grid">
          <div className="panel">
            <div className="panel-title">ORGANIZACIÓN / STAFF</div>
            <div className="staff-list">
              {staff.map(([role, name]) => <div key={role}><span>{role}</span><b>{name}</b></div>)}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">ÁREAS DE TRABAJO</div>
            <table>
              <thead><tr><th>Área</th><th>Encargado</th><th>Estado</th></tr></thead>
              <tbody>
                {[
                  ["Salud", "Felipe Olivares", "Activo"],
                  ["Seguridad", "Esteban Aguilera", "Activo"],
                  ["Búsqueda y rescate", "Gonzalo Duarte", "Desplegado"],
                  ["Logística", "Jacqueline Román", "Activo"],
                  ["Comunicaciones", "Tomás Surhoff", "Activo"],
                  ["Transporte", "Carlos Celis", "Desplegado"],
                ].map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td><span className="mini-state">{r[2]}</span></td></tr>)}
              </tbody>
            </table>
          </div>

          <div className="panel resources-panel">
            <div className="panel-title title-with-action">
              <span>RECURSOS ASIGNADOS</span>
              <button onClick={() => setShowResourceModal(true)}><Plus size={16}/> AGREGAR</button>
            </div>
            <div className="filters">
              {["Todos", "Vehículo", "Personal", "Equipo", "Comunicaciones"].map((item) => (
                <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>
                  {item}
                </button>
              ))}
            </div>
            <div className="resource-grid">
              {visibleResources.map((resource) => (
                <article className="resource-card" key={resource.id}>
                  <div className="resource-heading">
                    {iconFor(resource.type)}
                    <div><b>{resource.code}</b><span>{resource.name}</span></div>
                  </div>
                  <dl>
                    <div><dt>Responsable</dt><dd>{resource.responsible}</dd></div>
                    <div><dt>Ubicación</dt><dd>{resource.location}</dd></div>
                    <div><dt>Misión</dt><dd>{resource.assignment}</dd></div>
                  </dl>
                  <div className="resource-footer">
                    <select value={resource.status} onChange={(e) => changeStatus(resource, e.target.value as ResourceStatus)} className={statusClass(resource.status)}>
                      {statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <small>{resource.updatedAt}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="middle-grid">
          <div className="panel">
            <div className="panel-title">PLAN DE ACCIÓN / OBJETIVOS</div>
            <table>
              <thead><tr><th>Objetivo</th><th>Tarea</th><th>Responsable</th><th>Prioridad</th><th>Estado</th><th>Plazo</th></tr></thead>
              <tbody>{tasks.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>

          <div className="panel scene">
            <div className="panel-title">ESTADO DE LA ESCENA</div>
            <p><BadgeAlert size={17}/><span><b>Situación actual</b> Aluvión bloquea Ruta G-25; sectores aislados.</span></p>
            <p><Activity size={17}/><span><b>Riesgos</b> Nuevos desprendimientos y crecida de esteros.</span></p>
            <p><Ambulance size={17}/><span><b>Servicios críticos</b> Sin energía eléctrica en San Gabriel.</span></p>
            <div className="victims">
              <div><small>Evaluadas</small><b>38</b></div><div><small>Lesionados</small><b>7</b></div>
              <div><small>Trasladados</small><b>3</b></div><div><small>Aislados</small><b>26</b></div>
            </div>
          </div>

          <div className="panel map-panel">
            <div className="panel-title">MAPA / ESQUEMA</div>
            <div className="map-placeholder">
              <div className="route"></div>
              <span className="pin pin-a">PSR San Gabriel</span>
              <span className="pin pin-b">Ruta G-25 interrumpida</span>
              <span className="pin pin-c">PSR Las Vertientes</span>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel communications">
            <div className="panel-title">COMUNICACIONES</div>
            <div><b>146.520 MHz</b><span>Frecuencia principal</span></div>
            <div><b>155.340 MHz</b><span>Frecuencia alternativa</span></div>
            <div><b>+56 9 1234 5678</b><span>UGRED Salud</span></div>
          </div>

          <div className="panel log-panel">
            <div className="panel-title title-with-action">
              <span>BITÁCORA / LÍNEA DE TIEMPO</span>
              <button onClick={() => setShowLogModal(true)}><Plus size={16}/> EVENTO</button>
            </div>
            <div className="log-list">
              {log.slice(-6).map((entry) => <div key={entry.id}><b>{entry.time}</b><span>{entry.description}</span></div>)}
            </div>
          </div>

          <div className="panel quick-actions">
            <div className="panel-title">ACCIONES RÁPIDAS</div>
            <button><ClipboardList size={18}/> Nuevo incidente</button>
            <button><BookOpenText size={18}/> Reporte / SITREP</button>
            <button><Truck size={18}/> Catálogo de recursos</button>
            <button><Wrench size={18}/> Configuración</button>
          </div>
        </section>
      </main>

      {showResourceModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowResourceModal(false)}><X/></button>
            <h2>Agregar recurso al incidente</h2>
            <form onSubmit={(e) => { e.preventDefault(); addResource(e.currentTarget); }}>
              <label>Código<input name="code" required placeholder="Ej. V-02"/></label>
              <label>Nombre<input name="name" required placeholder="Ej. Camión aljibe municipal"/></label>
              <label>Tipo<select name="type"><option>Vehículo</option><option>Personal</option><option>Equipo</option><option>Comunicaciones</option><option>Otro</option></select></label>
              <label>Responsable<input name="responsible"/></label>
              <label>Ubicación<input name="location"/></label>
              <label>Misión<input name="assignment"/></label>
              <label>Cantidad<input name="quantity" type="number" min="1" defaultValue="1"/></label>
              <button className="primary" type="submit">Incorporar recurso</button>
            </form>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <button className="modal-close" onClick={() => setShowLogModal(false)}><X/></button>
            <h2>Agregar evento a la bitácora</h2>
            <textarea value={newLog} onChange={(e) => setNewLog(e.target.value)} placeholder="Describe el evento o decisión adoptada..." rows={5}/>
            <button className="primary" onClick={addLogEntry}>Registrar evento</button>
          </div>
        </div>
      )}
    </div>
  );
}
