import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, AlertTriangle, Ambulance, BarChart3, BookOpenText, CheckCircle2,
  Clock3, Database, FileText, HeartPulse, LayoutDashboard, Plus, Radio,
  ShieldAlert, Trash2, Truck, UserRound, UsersRound, X, Pencil, Search
} from "lucide-react";
import type {
  AppData, Patient, PatientCondition, Resource, ResourceStatus, ResourceType,
  Task, TimelineEntry
} from "./types";
import { loadLocal, saveLocal } from "./storage";
import { loadRemote, saveRemote, supabaseConfigured } from "./supabase";

const resourceStatuses: ResourceStatus[] = ["Disponible", "Asignado", "En tránsito", "En operación", "Fuera de servicio", "Liberado"];

const resourceGroups: {
  id: string;
  title: string;
  description: string;
  types: ResourceType[];
}[] = [
  {
    id: "vehiculos",
    title: "Vehículos",
    description: "Ambulancias, camionetas y otros medios de transporte.",
    types: ["Vehículo"]
  },
  {
    id: "equipamiento",
    title: "Equipamiento",
    description: "Equipos operativos, generadores, herramientas e insumos.",
    types: ["Equipo", "Insumo"]
  },
  {
    id: "comunicaciones",
    title: "Radios y comunicaciones",
    description: "Radios portátiles, bases, repetidores y enlaces.",
    types: ["Comunicaciones"]
  },
  {
    id: "personal",
    title: "Personal",
    description: "Funcionarios y equipos humanos desplegados.",
    types: ["Personal"]
  }
];
const patientConditions: PatientCondition[] = ["Evaluado", "En observación", "Traslado", "Hospitalizado", "Alta en terreno", "Fallecido"];

type OperationalResource = Resource & {
  deployedQuantity?: number;
};

function getDeployedQuantity(resource: Resource) {
  const operational = resource as OperationalResource;
  if (typeof operational.deployedQuantity === "number") {
    return Math.min(resource.quantity, Math.max(0, operational.deployedQuantity));
  }
  return ["Asignado", "En tránsito", "En operación"].includes(resource.status)
    ? resource.quantity
    : 0;
}

function getAvailableQuantity(resource: Resource) {
  return Math.max(0, resource.quantity - getDeployedQuantity(resource));
}

type Tab = "dashboard" | "incidente" | "recursos" | "pacientes" | "timeline" | "reporte";

function slug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

function elapsedLabel(startedAt: string, now: Date) {
  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start)) return "Sin hora de inicio";
  const minutes = Math.max(0, Math.floor((now.getTime() - start) / 60000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours > 0 ? `${hours} h ${remaining} min` : `${remaining} min`;
}

function App() {
  const initial = loadLocal();
  const [data, setData] = useState<AppData>(initial);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [now, setNow] = useState(new Date());
  const [sync, setSync] = useState("Guardado localmente");
  const [resourceModal, setResourceModal] = useState(false);
  const [patientModal, setPatientModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [timelineModal, setTimelineModal] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) return;
    loadRemote().then(remote => {
      if (remote) {
        setData(remote);
        setSync("Datos cargados desde Supabase");
      }
    }).catch(() => setSync("Usando almacenamiento local"));
  }, []);

  useEffect(() => {
    saveLocal(data);
    const timer = window.setTimeout(async () => {
      if (!supabaseConfigured) {
        setSync("Guardado localmente");
        return;
      }
      try {
        await saveRemote(data);
        setSync("Sincronizado con Supabase");
      } catch {
        setSync("Guardado local; error de sincronización");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [data]);

  const summary = useMemo(() => {
    const activeResources = data.resources.filter(r => ["Asignado", "En tránsito", "En operación"].includes(r.status)).length;
    const availableResources = data.resources.filter(r => r.status === "Disponible").length;
    const transfers = data.patients.filter(p => ["Traslado", "Hospitalizado"].includes(p.condition)).length;
    const deceased = data.patients.filter(p => p.condition === "Fallecido").length;
    const openTasks = data.tasks.filter(t => t.status !== "Cumplida").length;
    return { activeResources, availableResources, transfers, deceased, openTasks };
  }, [data]);

  function addTimeline(description: string, category: TimelineEntry["category"], author: string) {
    setData(current => ({
      ...current,
      timeline: [...current.timeline, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), category, description, author }]
    }));
  }

  function changeResourceStatus(resource: Resource, status: ResourceStatus) {
    setData(current => ({
      ...current,
      resources: current.resources.map(item => item.id === resource.id ? { ...item, status, updatedAt: new Date().toISOString() } : item)
    }));
    addTimeline(`${resource.code} · ${resource.name} cambia a ${status}.`, "Logística", "Sistema");
  }

  function changePatientCondition(patient: Patient, condition: PatientCondition) {
    setData(current => ({
      ...current,
      patients: current.patients.map(item => item.id === patient.id ? { ...item, condition, updatedAt: new Date().toISOString() } : item)
    }));
    addTimeline(`${patient.name} cambia condición a ${condition}.`, "Salud", "Equipo clínico");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src="/logo-ugred.jpg" alt="Logo UGRED" />
          <div><strong>SCI · UGRED</strong><span>San José de Maipo · Departamento de Salud</span></div>
        </div>
        <div className="clock"><Clock3 size={18}/><div><strong>{now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong><span>{now.toLocaleDateString("es-CL")}</span></div></div>
        <div className="sync"><Database size={16}/>{sync}</div>
      </header>

      <nav className="main-nav">
        <NavButton active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<LayoutDashboard/>} label="Resumen" />
        <NavButton active={tab === "incidente"} onClick={() => setTab("incidente")} icon={<ShieldAlert/>} label="Incidente" />
        <NavButton active={tab === "recursos"} onClick={() => setTab("recursos")} icon={<Truck/>} label="Recursos" />
        <NavButton active={tab === "pacientes"} onClick={() => setTab("pacientes")} icon={<HeartPulse/>} label="Pacientes" />
        <NavButton active={tab === "timeline"} onClick={() => setTab("timeline")} icon={<BookOpenText/>} label="Línea de tiempo" />
        <NavButton active={tab === "reporte"} onClick={() => setTab("reporte")} icon={<FileText/>} label="SITREP" />
      </nav>

      {tab === "dashboard" && <Dashboard data={data} summary={summary} now={now} setTab={setTab} />}
      {tab === "incidente" && <IncidentPanel data={data} setData={setData} setTaskModal={setTaskModal} />}
      {tab === "recursos" && <ResourcesPanel data={data} setData={setData} changeStatus={changeResourceStatus} addTimeline={addTimeline} openModal={() => setResourceModal(true)} />}
      {tab === "pacientes" && <PatientsPanel data={data} setData={setData} changeCondition={changePatientCondition} openModal={() => setPatientModal(true)} />}
      {tab === "timeline" && <TimelinePanel data={data} openModal={() => setTimelineModal(true)} />}
      {tab === "reporte" && <ReportPanel data={data} summary={summary} now={now} />}

      <footer className="quickbar">
        <button onClick={() => setTimelineModal(true)}><BookOpenText size={18}/>Registrar evento</button>
        <button onClick={() => setPatientModal(true)}><HeartPulse size={18}/>Agregar paciente</button>
        <button onClick={() => setResourceModal(true)}><Truck size={18}/>Agregar recurso</button>
      </footer>

      {resourceModal && <ResourceModal close={() => setResourceModal(false)} onSubmit={(resource) => {
        setData(current => ({ ...current, resources: [...current.resources, resource] }));
        addTimeline(`Se incorpora recurso ${resource.code} · ${resource.name}.`, "Logística", "Operador");
        setResourceModal(false);
      }} />}
      {patientModal && <PatientModal close={() => setPatientModal(false)} onSubmit={(patient) => {
        setData(current => ({ ...current, patients: [...current.patients, patient] }));
        addTimeline(`Se registra paciente ${patient.name} con condición ${patient.condition}.`, "Salud", "Equipo clínico");
        setPatientModal(false);
      }} />}
      {taskModal && <TaskModal close={() => setTaskModal(false)} onSubmit={(task) => {
        setData(current => ({ ...current, tasks: [...current.tasks, task] }));
        addTimeline(`Nueva tarea asignada a ${task.responsible}.`, "Decisión", data.incident.commander);
        setTaskModal(false);
      }} />}
      {timelineModal && <TimelineModal close={() => setTimelineModal(false)} onSubmit={(entry) => {
        setData(current => ({ ...current, timeline: [...current.timeline, entry] }));
        setTimelineModal(false);
      }} />}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return <button className={active ? "active" : ""} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function Dashboard({ data, summary, now, setTab }: { data: AppData; summary: { activeResources: number; availableResources: number; transfers: number; deceased: number; openTasks: number }; now: Date; setTab: (tab: Tab) => void }) {
  const incident = data.incident;
  return <main className="page dashboard">
    <section className={`incident-banner level-${slug(incident.level)}`}>
      <div><span className="eyebrow">INCIDENTE ACTIVO</span><h1>{incident.name}</h1><p>{incident.type} · {incident.location}</p></div>
      <div className="incident-command"><span>A cargo</span><strong>{incident.commander}</strong><small>Subrogante: {incident.deputy}</small></div>
      <div className="incident-duration"><span>Tiempo transcurrido</span><strong>{elapsedLabel(incident.startedAt, now)}</strong><small>Inicio {new Date(incident.startedAt).toLocaleString("es-CL")}</small></div>
      <div className="incident-level"><span>Gravedad</span><strong>{incident.level}</strong><small>{incident.status}</small></div>
    </section>

    <section className="metrics-grid">
      <Metric icon={<Truck/>} label="Recursos activos" value={summary.activeResources} note={`${summary.availableResources} disponibles`} />
      <Metric icon={<UsersRound/>} label="Personas registradas" value={data.patients.length} note={`${summary.transfers} trasladadas/hospitalizadas`} />
      <Metric icon={<AlertTriangle/>} label="Fallecidos" value={summary.deceased} note="Consolidado operacional" danger={summary.deceased > 0} />
      <Metric icon={<CheckCircle2/>} label="Tareas abiertas" value={summary.openTasks} note={`${data.tasks.filter(t => t.status === "Cumplida").length} cumplidas`} />
    </section>

    <section className="dashboard-grid">
      <article className="panel"><div className="panel-head"><h2><Activity/>Situación actual</h2><button onClick={() => setTab("incidente")}>Editar</button></div><p className="lead">{incident.situation}</p><div className="info-block"><strong>Riesgos principales</strong><p>{incident.risks}</p></div><div className="info-block"><strong>Servicios críticos</strong><p>{incident.criticalServices}</p></div></article>
      <article className="panel"><div className="panel-head"><h2><BarChart3/>Consolidado clínico</h2><button onClick={() => setTab("pacientes")}>Ver listado</button></div><ConditionBars patients={data.patients}/></article>
      <article className="panel wide">
        <div className="panel-head">
          <h2><Truck/>Estado de recursos</h2>
          <button onClick={() => setTab("recursos")}>Administrar</button>
        </div>
        <div className="dashboard-resource-categories">
          {resourceGroups.map(group => {
            const resources = data.resources.filter(resource => group.types.includes(resource.type));
            const total = resources.reduce((sum, resource) => sum + resource.quantity, 0);
            const deployed = resources.reduce((sum, resource) => sum + getDeployedQuantity(resource), 0);
            const available = resources.reduce((sum, resource) => sum + getAvailableQuantity(resource), 0);

            return (
              <button key={group.id} onClick={() => setTab("recursos")}>
                <span>{group.title}</span>
                <strong>{total}</strong>
                <small>{deployed} desplegados · {available} disponibles</small>
              </button>
            );
          })}
        </div>

        <div className="resource-summary resource-summary-detailed">
          {resourceStatuses.map(status => {
            const resources = data.resources.filter(resource => resource.status === status);
            const total = resources.reduce((quantity, resource) => quantity + resource.quantity, 0);

            return (
              <div className={`summary-status status-${slug(status)}`} key={status}>
                <div className="summary-status-head">
                  <span>{status}</span>
                  <strong>{total}</strong>
                </div>

                <div className="summary-resource-list">
                  {resources.map(resource => (
                    <div className="summary-resource-item" key={resource.id}>
                      <div>
                        <b>{resource.name}</b>
                        <small>{resource.code} · Cantidad: {resource.quantity}</small>
                      </div>
                      <p>{resource.responsible || "Sin responsable asignado"}</p>
                    </div>
                  ))}

                  {!resources.length && (
                    <p className="summary-empty">Sin recursos en este estado</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </article>
      <article className="panel wide"><div className="panel-head"><h2><BookOpenText/>Últimos eventos</h2><button onClick={() => setTab("timeline")}>Abrir línea de tiempo</button></div><div className="mini-timeline">{[...data.timeline].reverse().slice(0, 5).map(entry => <div key={entry.id}><time>{new Date(entry.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</time><span className={`category category-${slug(entry.category)}`}>{entry.category}</span><p>{entry.description}</p></div>)}</div></article>
    </section>
  </main>;
}

function Metric({ icon, label, value, note, danger = false }: { icon: ReactNode; label: string; value: number; note: string; danger?: boolean }) {
  return <article className={`metric ${danger ? "danger" : ""}`}><div>{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function ConditionBars({ patients }: { patients: Patient[] }) {
  if (!patients.length) return <div className="empty-state"><HeartPulse/><p>No hay pacientes registrados.</p></div>;
  const max = Math.max(1, ...patientConditions.map(c => patients.filter(p => p.condition === c).length));
  return <div className="condition-bars">{patientConditions.map(condition => { const count = patients.filter(p => p.condition === condition).length; return <div key={condition}><span>{condition}</span><div><i style={{ width: `${(count / max) * 100}%` }}/></div><strong>{count}</strong></div>; })}</div>;
}

function IncidentPanel({ data, setData, setTaskModal }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; setTaskModal: (value: boolean) => void }) {
  const incident = data.incident;
  const update = (key: keyof typeof incident, value: string) => setData(current => ({ ...current, incident: { ...current.incident, [key]: value } }));
  return <main className="page"><section className="page-title"><div><span className="eyebrow">COMANDO</span><h1>Gestión del incidente</h1><p>Identificación, objetivos, situación y plan de acción.</p></div><button onClick={() => setTaskModal(true)}><Plus/>Nueva tarea</button></section>
    <section className="two-columns"><article className="panel form-panel"><h2>Datos generales</h2><div className="form-grid"><label>Nombre<input value={incident.name} onChange={e => update("name", e.target.value)}/></label><label>Tipo<input value={incident.type} onChange={e => update("type", e.target.value)}/></label><label>Ubicación<input value={incident.location} onChange={e => update("location", e.target.value)}/></label><label>Inicio<input type="datetime-local" value={incident.startedAt} onChange={e => update("startedAt", e.target.value)}/></label><label>Comandante<input value={incident.commander} onChange={e => update("commander", e.target.value)}/></label><label>Subrogante<input value={incident.deputy} onChange={e => update("deputy", e.target.value)}/></label><label>Nivel<select value={incident.level} onChange={e => update("level", e.target.value)}><option>VERDE</option><option>AMARILLO</option><option>ROJO</option></select></label><label>Estado<select value={incident.status} onChange={e => update("status", e.target.value)}><option>Activo</option><option>En monitoreo</option><option>Cerrado</option></select></label></div></article>
      <article className="panel form-panel"><h2>Situación operativa</h2><label>Objetivo general<textarea value={incident.objective} onChange={e => update("objective", e.target.value)}/></label><label>Situación actual<textarea value={incident.situation} onChange={e => update("situation", e.target.value)}/></label><label>Riesgos<textarea value={incident.risks} onChange={e => update("risks", e.target.value)}/></label><label>Servicios críticos<textarea value={incident.criticalServices} onChange={e => update("criticalServices", e.target.value)}/></label></article></section>
    <section className="panel"><div className="panel-head"><h2>Plan de acción</h2><button onClick={() => setTaskModal(true)}><Plus/>Agregar</button></div><div className="task-list">{data.tasks.map(task => <div className={`task priority-${slug(task.priority)}`} key={task.id}><div><strong>{task.objective}</strong><p>{task.action}</p><small>{task.responsible} · {task.deadline ? new Date(task.deadline).toLocaleString("es-CL") : "Sin plazo"}</small></div><select value={task.status} onChange={e => setData(current => ({ ...current, tasks: current.tasks.map(item => item.id === task.id ? { ...item, status: e.target.value as Task["status"] } : item) }))}><option>Pendiente</option><option>En curso</option><option>Cumplida</option></select></div>)}</div></section>
  </main>;
}

function ResourcesPanel({
  data,
  setData,
  changeStatus,
  addTimeline,
  openModal
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  changeStatus: (resource: Resource, status: ResourceStatus) => void;
  addTimeline: (description: string, category: TimelineEntry["category"], author: string) => void;
  openModal: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"Todos" | ResourceType>("Todos");
  const [statusFilter, setStatusFilter] = useState<"Todos" | ResourceStatus>("Todos");
  const [locationFilter, setLocationFilter] = useState("Todos");
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const locations = useMemo(
    () => [...new Set(data.resources.map(resource => resource.location).filter(Boolean))].sort(),
    [data.resources]
  );

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return data.resources.filter(resource => {
      const matchesSearch = !normalizedSearch || [
        resource.code,
        resource.name,
        resource.role,
        resource.responsible,
        resource.location,
        resource.assignment
      ].some(value => value?.toLowerCase().includes(normalizedSearch));

      const matchesType = typeFilter === "Todos" || resource.type === typeFilter;
      const matchesStatus = statusFilter === "Todos" || resource.status === statusFilter;
      const matchesLocation = locationFilter === "Todos" || resource.location === locationFilter;

      return matchesSearch && matchesType && matchesStatus && matchesLocation;
    });
  }, [data.resources, searchTerm, typeFilter, statusFilter, locationFilter]);

  function removeResource(resource: Resource) {
    const confirmed = window.confirm(
      `¿Eliminar el recurso "${resource.name}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setData(current => ({
      ...current,
      resources: current.resources.filter(item => item.id !== resource.id)
    }));
    addTimeline(
      `Se elimina el recurso ${resource.code} · ${resource.name}.`,
      "Logística",
      "Operador"
    );
  }

  function updateResource(updatedResource: Resource) {
    const previous = data.resources.find(resource => resource.id === updatedResource.id);
    if (!previous) return;

    setData(current => ({
      ...current,
      resources: current.resources.map(resource =>
        resource.id === updatedResource.id ? updatedResource : resource
      )
    }));

    const changes: string[] = [];
    if (previous.name !== updatedResource.name) changes.push(`nombre: ${previous.name} → ${updatedResource.name}`);
    if (previous.code !== updatedResource.code) changes.push(`código: ${previous.code} → ${updatedResource.code}`);
    if (previous.type !== updatedResource.type) changes.push(`tipo: ${previous.type} → ${updatedResource.type}`);
    if (previous.role !== updatedResource.role) changes.push(`rol: ${previous.role} → ${updatedResource.role}`);
    if (previous.responsible !== updatedResource.responsible) changes.push(`responsable: ${previous.responsible || "sin asignar"} → ${updatedResource.responsible || "sin asignar"}`);
    if (previous.location !== updatedResource.location) changes.push(`ubicación: ${previous.location || "sin ubicación"} → ${updatedResource.location || "sin ubicación"}`);
    if (previous.assignment !== updatedResource.assignment) changes.push(`asignación actualizada`);
    if (previous.quantity !== updatedResource.quantity) changes.push(`inventario: ${previous.quantity} → ${updatedResource.quantity}`);
    if (getDeployedQuantity(previous) !== getDeployedQuantity(updatedResource)) {
      changes.push(`desplegados: ${getDeployedQuantity(previous)} → ${getDeployedQuantity(updatedResource)}`);
    }
    if (previous.status !== updatedResource.status) changes.push(`estado: ${previous.status} → ${updatedResource.status}`);

    addTimeline(
      `${updatedResource.code} · ${updatedResource.name}: ${changes.length ? changes.join("; ") : "ficha revisada sin cambios relevantes"}.`,
      "Logística",
      "Operador"
    );
    setEditingResource(null);
  }

  const hasFilters =
    searchTerm !== "" ||
    typeFilter !== "Todos" ||
    statusFilter !== "Todos" ||
    locationFilter !== "Todos";

  return (
    <main className="page">
      <section className="page-title">
        <div>
          <span className="eyebrow">LOGÍSTICA Y OPERACIONES</span>
          <h1>Recursos y personal</h1>
          <p>Inventario, despliegue, responsables y situación operacional.</p>
        </div>
        <button onClick={openModal}><Plus/>Agregar recurso</button>
      </section>

      <section className="resource-category-summary">
        {resourceGroups.map(group => {
          const groupResources = data.resources.filter(resource =>
            group.types.includes(resource.type)
          );
          const total = groupResources.reduce((sum, resource) => sum + resource.quantity, 0);
          const deployed = groupResources.reduce((sum, resource) => sum + getDeployedQuantity(resource), 0);
          const available = groupResources.reduce((sum, resource) => sum + getAvailableQuantity(resource), 0);

          return (
            <article key={group.id}>
              <span>{group.title}</span>
              <strong>{total}</strong>
              <small>{deployed} desplegados · {available} disponibles</small>
            </article>
          );
        })}
      </section>

      <section className="panel resource-filters">
        <label className="resource-search">
          <Search/>
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre, código, responsable o asignación"
          />
        </label>

        <label>
          <span>Categoría</span>
          <select value={typeFilter} onChange={event => setTypeFilter(event.target.value as "Todos" | ResourceType)}>
            <option>Todos</option>
            <option>Personal</option>
            <option>Vehículo</option>
            <option>Equipo</option>
            <option>Comunicaciones</option>
            <option>Insumo</option>
          </select>
        </label>

        <label>
          <span>Estado</span>
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as "Todos" | ResourceStatus)}>
            <option>Todos</option>
            {resourceStatuses.map(status => <option key={status}>{status}</option>)}
          </select>
        </label>

        <label>
          <span>Ubicación</span>
          <select value={locationFilter} onChange={event => setLocationFilter(event.target.value)}>
            <option>Todos</option>
            {locations.map(location => <option key={location}>{location}</option>)}
          </select>
        </label>

        {hasFilters && (
          <button
            className="clear-filters"
            onClick={() => {
              setSearchTerm("");
              setTypeFilter("Todos");
              setStatusFilter("Todos");
              setLocationFilter("Todos");
            }}
          >
            Limpiar filtros
          </button>
        )}
      </section>

      <div className="resource-groups">
        {resourceGroups.map(group => {
          const resources = filteredResources.filter(resource =>
            group.types.includes(resource.type)
          );

          return (
            <section className="resource-group" key={group.id}>
              <div className="resource-group-heading">
                <div>
                  <span className="eyebrow">RECURSOS</span>
                  <h2>{group.title}</h2>
                  <p>{group.description}</p>
                </div>
                <strong>{resources.reduce((sum, resource) => sum + resource.quantity, 0)}</strong>
              </div>

              {resources.length > 0 ? (
                <div className="resource-board">
                  {resources.map(resource => {
                    const deployed = getDeployedQuantity(resource);
                    const available = getAvailableQuantity(resource);

                    return (
                      <article className={`resource-card status-${slug(resource.status)}`} key={resource.id}>
                        <div className="resource-top">
                          <span className="resource-code">{resource.code}</span>
                          <span className="resource-status">{resource.status}</span>
                        </div>

                        <h3>{resource.name}</h3>
                        <p className="role">{resource.role}</p>

                        <div className="resource-quantity-strip">
                          <div><span>Inventario</span><strong>{resource.quantity}</strong></div>
                          <div><span>Desplegado</span><strong>{deployed}</strong></div>
                          <div><span>Disponible</span><strong>{available}</strong></div>
                        </div>

                        <dl>
                          <div><dt>Responsable</dt><dd>{resource.responsible || "Sin responsable asignado"}</dd></div>
                          <div><dt>Ubicación</dt><dd>{resource.location || "Sin ubicación"}</dd></div>
                          <div className="wide"><dt>Asignación</dt><dd>{resource.assignment || "Sin asignación"}</dd></div>
                        </dl>

                        {(!resource.responsible || !resource.location) && (
                          <div className="resource-warning">
                            <AlertTriangle/>
                            <span>
                              {!resource.responsible && !resource.location
                                ? "Falta responsable y ubicación"
                                : !resource.responsible
                                  ? "Recurso sin responsable"
                                  : "Recurso sin ubicación"}
                            </span>
                          </div>
                        )}

                        <div className="resource-actions">
                          <select
                            value={resource.status}
                            onChange={event => changeStatus(resource, event.target.value as ResourceStatus)}
                          >
                            {resourceStatuses.map(status => <option key={status}>{status}</option>)}
                          </select>

                          <button
                            className="edit-icon"
                            aria-label={`Editar ${resource.name}`}
                            onClick={() => setEditingResource(resource)}
                          >
                            <Pencil/>
                          </button>

                          <button
                            className="danger-icon"
                            aria-label={`Eliminar ${resource.name}`}
                            onClick={() => removeResource(resource)}
                          >
                            <Trash2/>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="resource-group-empty">
                  <Truck/>
                  <p>
                    {hasFilters
                      ? "No hay recursos de esta categoría que coincidan con los filtros."
                      : "No hay recursos registrados en esta categoría."}
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {editingResource && (
        <ResourceModal
          close={() => setEditingResource(null)}
          initialResource={editingResource}
          onSubmit={updateResource}
        />
      )}
    </main>
  );
}

function PatientsPanel({ data, setData, changeCondition, openModal }: { data: AppData; setData: React.Dispatch<React.SetStateAction<AppData>>; changeCondition: (patient: Patient, condition: PatientCondition) => void; openModal: () => void }) {
  return <main className="page"><section className="page-title"><div><span className="eyebrow">SALUD</span><h1>Registro de pacientes</h1><p>Listado operacional para consolidación, seguimiento y reporte.</p></div><button onClick={openModal}><Plus/>Agregar paciente</button></section>
    <section className="patient-summary">{patientConditions.map(condition => <div className={`condition-${slug(condition)}`} key={condition}><span>{condition}</span><strong>{data.patients.filter(p => p.condition === condition).length}</strong></div>)}</section>
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>RUT</th><th>Sexo</th><th>Ciclo vital</th><th>Condición</th><th>Destino</th><th>Observaciones</th><th></th></tr></thead><tbody>{data.patients.map(patient => <tr key={patient.id}><td><strong>{patient.name}</strong></td><td>{patient.rut}</td><td>{patient.sex}</td><td>{patient.lifeCycle}</td><td><select className={`patient-select condition-${slug(patient.condition)}`} value={patient.condition} onChange={e => changeCondition(patient, e.target.value as PatientCondition)}>{patientConditions.map(condition => <option key={condition}>{condition}</option>)}</select></td><td>{patient.destination || "—"}</td><td>{patient.observations || "—"}</td><td><button className="danger-icon" onClick={() => setData(current => ({ ...current, patients: current.patients.filter(item => item.id !== patient.id) }))}><Trash2/></button></td></tr>)}{!data.patients.length && <tr><td colSpan={8}><div className="empty-state"><UsersRound/><p>No hay pacientes registrados.</p></div></td></tr>}</tbody></table></div></section>
  </main>;
}

function TimelinePanel({ data, openModal }: { data: AppData; openModal: () => void }) {
  return <main className="page"><section className="page-title"><div><span className="eyebrow">BITÁCORA</span><h1>Línea de tiempo operacional</h1><p>Registro cronológico de hechos, decisiones, comunicaciones y acciones.</p></div><button onClick={openModal}><Plus/>Registrar evento</button></section><section className="timeline-page">{[...data.timeline].reverse().map(entry => <article key={entry.id}><div className="timeline-dot"/><time>{new Date(entry.createdAt).toLocaleString("es-CL")}</time><span className={`category category-${slug(entry.category)}`}>{entry.category}</span><h3>{entry.description}</h3><p>Registrado por: {entry.author}</p></article>)}</section></main>;
}

function ReportPanel({ data, summary, now }: { data: AppData; summary: { activeResources: number; availableResources: number; transfers: number; deceased: number; openTasks: number }; now: Date }) {
  return (
    <main className="page report-page">
      <section className="page-title no-print">
        <div>
          <span className="eyebrow">REPORTE</span>
          <h1>SITREP consolidado</h1>
          <p>Vista preparada para impresión o guardado como PDF.</p>
        </div>
        <button onClick={() => window.print()}><FileText/>Imprimir / Guardar PDF</button>
      </section>

      <article className="sitrep">
        <header>
          <img src="/logo-ugred.jpg" alt="Logo UGRED"/>
          <div>
            <span>DEPARTAMENTO DE SALUD · SAN JOSÉ DE MAIPO</span>
            <h1>SITREP · {data.incident.name}</h1>
            <p>Emitido {now.toLocaleString("es-CL")}</p>
          </div>
        </header>

        <section>
          <h2>1. Identificación</h2>
          <div className="report-grid">
            <p><strong>Tipo:</strong> {data.incident.type}</p>
            <p><strong>Ubicación:</strong> {data.incident.location}</p>
            <p><strong>Nivel:</strong> {data.incident.level}</p>
            <p><strong>Estado:</strong> {data.incident.status}</p>
            <p><strong>Comandante:</strong> {data.incident.commander}</p>
            <p><strong>Inicio:</strong> {new Date(data.incident.startedAt).toLocaleString("es-CL")}</p>
          </div>
        </section>

        <section>
          <h2>2. Situación</h2>
          <p>{data.incident.situation}</p>
          <h3>Riesgos</h3>
          <p>{data.incident.risks}</p>
          <h3>Servicios críticos</h3>
          <p>{data.incident.criticalServices}</p>
        </section>

        <section>
          <h2>3. Consolidado</h2>
          <p>
            Pacientes registrados: {data.patients.length} ·
            Trasladados/hospitalizados: {summary.transfers} ·
            Fallecidos: {summary.deceased} ·
            Recursos activos: {summary.activeResources} ·
            Recursos disponibles: {summary.availableResources}.
          </p>
        </section>

        <section>
          <h2>4. Pacientes</h2>
          <table>
            <thead>
              <tr><th>Nombre</th><th>RUT</th><th>Sexo</th><th>Ciclo vital</th><th>Condición</th><th>Destino</th></tr>
            </thead>
            <tbody>
              {data.patients.map(patient => (
                <tr key={patient.id}>
                  <td>{patient.name}</td>
                  <td>{patient.rut}</td>
                  <td>{patient.sex}</td>
                  <td>{patient.lifeCycle}</td>
                  <td>{patient.condition}</td>
                  <td>{patient.destination || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2>5. Recursos</h2>
          {resourceGroups.map(group => {
            const resources = data.resources.filter(resource => group.types.includes(resource.type));
            if (!resources.length) return null;

            return (
              <div className="sitrep-resource-group" key={group.id}>
                <h3>{group.title}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Recurso</th>
                      <th>Inventario</th>
                      <th>Desplegado</th>
                      <th>Responsable</th>
                      <th>Ubicación</th>
                      <th>Estado</th>
                      <th>Asignación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(resource => (
                      <tr key={resource.id}>
                        <td>{resource.code}</td>
                        <td>{resource.name}</td>
                        <td>{resource.quantity}</td>
                        <td>{getDeployedQuantity(resource)}</td>
                        <td>{resource.responsible || "—"}</td>
                        <td>{resource.location || "—"}</td>
                        <td>{resource.status}</td>
                        <td>{resource.assignment || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>

        <section>
          <h2>6. Plan de acción</h2>
          <ul>{data.tasks.map(task => <li key={task.id}>{task.objective} — {task.responsible} — {task.status}</li>)}</ul>
        </section>

        <section>
          <h2>7. Eventos recientes</h2>
          <ul>
            {data.timeline.slice(-12).map(entry => (
              <li key={entry.id}>
                {new Date(entry.createdAt).toLocaleString("es-CL")} · {entry.category} · {entry.description}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) { return <div className="modal-bg" onMouseDown={e => e.target === e.currentTarget && close()}><div className="modal"><button className="close" onClick={close}><X/></button><h2>{title}</h2>{children}</div></div>; }

function ResourceModal({
  close,
  onSubmit,
  initialResource
}: {
  close: () => void;
  onSubmit: (resource: Resource) => void;
  initialResource?: Resource;
}) {
  const editing = Boolean(initialResource);
  const deployedQuantity = initialResource ? getDeployedQuantity(initialResource) : 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const quantity = Math.max(1, Number(formData.get("quantity") || 1));
    const deployed = Math.min(quantity, Math.max(0, Number(formData.get("deployedQuantity") || 0)));

    const resource: OperationalResource = {
      id: initialResource?.id ?? crypto.randomUUID(),
      code: String(formData.get("code")),
      name: String(formData.get("name")),
      type: String(formData.get("type")) as ResourceType,
      role: String(formData.get("role")),
      responsible: String(formData.get("responsible") || ""),
      location: String(formData.get("location") || ""),
      assignment: String(formData.get("assignment") || ""),
      quantity,
      deployedQuantity: deployed,
      status: String(formData.get("status") || "Disponible") as ResourceStatus,
      updatedAt: new Date().toISOString()
    };

    onSubmit(resource);
  }

  return (
    <Modal title={editing ? "Editar recurso" : "Agregar recurso o personal"} close={close}>
      <form className="form-grid" onSubmit={submit}>
        <label>
          Código
          <input name="code" required defaultValue={initialResource?.code}/>
        </label>

        <label>
          Nombre
          <input name="name" required defaultValue={initialResource?.name}/>
        </label>

        <label>
          Tipo
          <select name="type" defaultValue={initialResource?.type ?? "Personal"}>
            <option>Personal</option>
            <option>Vehículo</option>
            <option>Equipo</option>
            <option>Comunicaciones</option>
            <option>Insumo</option>
          </select>
        </label>

        <label>
          Estado
          <select name="status" defaultValue={initialResource?.status ?? "Disponible"}>
            {resourceStatuses.map(status => <option key={status}>{status}</option>)}
          </select>
        </label>

        <label>
          Inventario total
          <input name="quantity" type="number" min="1" defaultValue={initialResource?.quantity ?? 1}/>
        </label>

        <label>
          Cantidad desplegada
          <input name="deployedQuantity" type="number" min="0" defaultValue={deployedQuantity}/>
        </label>

        <label>
          Rol
          <input name="role" required defaultValue={initialResource?.role} placeholder="Ej. Operaciones clínicas"/>
        </label>

        <label>
          Responsable
          <input name="responsible" defaultValue={initialResource?.responsible}/>
        </label>

        <label>
          Ubicación
          <input name="location" defaultValue={initialResource?.location}/>
        </label>

        <label>
          Asignación
          <input name="assignment" defaultValue={initialResource?.assignment}/>
        </label>

        <div className="modal-quantity-note wide">
          La cantidad desplegada nunca será mayor al inventario total.
        </div>

        <button type="submit">
          {editing ? <Pencil/> : <Plus/>}
          {editing ? "Guardar cambios" : "Agregar"}
        </button>
      </form>
    </Modal>
  );
}

function PatientModal({ close, onSubmit }: { close: () => void; onSubmit: (patient: Patient) => void }) {
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); onSubmit({ id: crypto.randomUUID(), name: String(fd.get("name")), rut: String(fd.get("rut")), sex: String(fd.get("sex")) as Patient["sex"], lifeCycle: String(fd.get("lifeCycle")) as Patient["lifeCycle"], condition: String(fd.get("condition")) as PatientCondition, destination: String(fd.get("destination") || ""), observations: String(fd.get("observations") || ""), updatedAt: new Date().toISOString() }); }
  return <Modal title="Registrar paciente" close={close}><form className="form-grid" onSubmit={submit}><label className="wide">Nombre completo<input name="name" required/></label><label>RUT<input name="rut" required placeholder="12.345.678-9"/></label><label>Sexo<select name="sex"><option>Femenino</option><option>Masculino</option><option>Intersex</option><option>No informado</option></select></label><label>Ciclo vital<select name="lifeCycle"><option>Infancia</option><option>Adolescencia</option><option>Adulto</option><option>Persona mayor</option><option>Gestante</option><option>No informado</option></select></label><label>Condición<select name="condition">{patientConditions.map(c => <option key={c}>{c}</option>)}</select></label><label className="wide">Destino<input name="destination" placeholder="Hospital, posta o lugar de derivación"/></label><label className="wide">Observaciones<textarea name="observations"/></label><button type="submit"><Plus/>Registrar</button></form></Modal>;
}

function TaskModal({ close, onSubmit }: { close: () => void; onSubmit: (task: Task) => void }) {
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); onSubmit({ id: crypto.randomUUID(), objective: String(fd.get("objective")), action: String(fd.get("action")), responsible: String(fd.get("responsible")), priority: String(fd.get("priority")) as Task["priority"], status: "Pendiente", deadline: String(fd.get("deadline") || "") }); }
  return <Modal title="Nueva tarea" close={close}><form className="form-grid" onSubmit={submit}><label className="wide">Objetivo<input name="objective" required/></label><label className="wide">Acción concreta<input name="action" required/></label><label>Responsable<input name="responsible" required/></label><label>Prioridad<select name="priority"><option>Alta</option><option>Media</option><option>Baja</option></select></label><label>Plazo<input name="deadline" type="datetime-local"/></label><button type="submit"><Plus/>Crear tarea</button></form></Modal>;
}

function TimelineModal({ close, onSubmit }: { close: () => void; onSubmit: (entry: TimelineEntry) => void }) {
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const fd = new FormData(e.currentTarget); onSubmit({ id: crypto.randomUUID(), createdAt: String(fd.get("createdAt")) ? new Date(String(fd.get("createdAt"))).toISOString() : new Date().toISOString(), category: String(fd.get("category")) as TimelineEntry["category"], description: String(fd.get("description")), author: String(fd.get("author")) }); }
  return <Modal title="Registrar evento operacional" close={close}><form className="form-grid" onSubmit={submit}><label>Fecha y hora<input name="createdAt" type="datetime-local" defaultValue={new Date().toISOString().slice(0,16)}/></label><label>Categoría<select name="category"><option>Activación</option><option>Operaciones</option><option>Salud</option><option>Logística</option><option>Comunicaciones</option><option>Decisión</option></select></label><label className="wide">Descripción<textarea name="description" required/></label><label>Registrado por<input name="author" required defaultValue="Operador"/></label><button type="submit"><Plus/>Registrar evento</button></form></Modal>;
}

export default App;
