import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, BookOpenText, Check, ClipboardList, Database,
  Edit3, FileText, Plus, Save, Trash2, Truck, X
} from "lucide-react";
import type { Incident, LogEntry, Resource, ResourceStatus, Task } from "./types";
import { loadLocal, saveLocal, type AppData } from "./storage";
import { loadRemote, saveRemote, supabaseConfigured } from "./supabase";

const resourceStatuses: ResourceStatus[] = [
  "Disponible", "Asignado", "En tránsito", "En operación", "Fuera de servicio", "Liberado"
];

function nowText() {
  return new Date().toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
}

function App() {
  const initial = loadLocal();
  const [incident, setIncident] = useState<Incident>(initial.incident);
  const [resources, setResources] = useState<Resource[]>(initial.resources);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [log, setLog] = useState<LogEntry[]>(initial.log);
  const [tab, setTab] = useState<"tablero" | "recursos" | "bitacora" | "reporte">("tablero");
  const [editingIncident, setEditingIncident] = useState(false);
  const [resourceModal, setResourceModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [logText, setLogText] = useState("");
  const [syncState, setSyncState] = useState("Guardado localmente");

  const data: AppData = useMemo(() => ({ incident, resources, tasks, log }), [incident, resources, tasks, log]);

  useEffect(() => {
    saveLocal(data);
    setSyncState("Guardado localmente");
    const t = window.setTimeout(async () => {
      if (!supabaseConfigured) return;
      try {
        await saveRemote(data);
        setSyncState("Sincronizado con Supabase");
      } catch {
        setSyncState("Guardado local; Supabase no disponible");
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [data]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    loadRemote().then(remote => {
      if (!remote) return;
      setIncident(remote.incident);
      setResources(remote.resources);
      setTasks(remote.tasks);
      setLog(remote.log);
      setSyncState("Datos cargados desde Supabase");
    }).catch(() => setSyncState("Usando almacenamiento local"));
  }, []);

  function addLog(description: string) {
    setLog(current => [...current, {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      description
    }]);
  }

  function createNewIncident() {
    if (!confirm("¿Crear un nuevo incidente? Se reemplazará el incidente actual.")) return;
    const fresh: Incident = {
      ...incident,
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
      startedAt: new Date().toISOString().slice(0, 16),
      evaluated: 0, injured: 0, transferred: 0, isolated: 0
    };
    setIncident(fresh);
    setTasks([]);
    setLog([{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), description: "Nuevo incidente creado." }]);
    setTab("tablero");
  }

  function addResource(form: HTMLFormElement) {
    const fd = new FormData(form);
    const resource: Resource = {
      id: crypto.randomUUID(),
      code: String(fd.get("code")),
      name: String(fd.get("name")),
      type: String(fd.get("type")) as Resource["type"],
      status: "Disponible",
      responsible: String(fd.get("responsible") || "Sin asignar"),
      location: String(fd.get("location") || "Puesto de comando"),
      assignment: String(fd.get("assignment") || "Sin asignar"),
      quantity: Number(fd.get("quantity") || 1),
      updatedAt: new Date().toISOString()
    };
    setResources(r => [...r, resource]);
    addLog(`Recurso ${resource.code} · ${resource.name} incorporado.`);
    setResourceModal(false);
  }

  function changeResourceStatus(resource: Resource, status: ResourceStatus) {
    setResources(items => items.map(item =>
      item.id === resource.id ? { ...item, status, updatedAt: new Date().toISOString() } : item
    ));
    addLog(`${resource.code} cambió de ${resource.status} a ${status}.`);
  }

  function addTask(form: HTMLFormElement) {
    const fd = new FormData(form);
    const task: Task = {
      id: crypto.randomUUID(),
      objective: String(fd.get("objective")),
      action: String(fd.get("action")),
      responsible: String(fd.get("responsible")),
      priority: String(fd.get("priority")) as Task["priority"],
      status: "Pendiente",
      deadline: String(fd.get("deadline") || "")
    };
    setTasks(t => [...t, task]);
    addLog(`Nueva tarea asignada a ${task.responsible}.`);
    setTaskModal(false);
  }

  function addManualLog() {
    if (!logText.trim()) return;
    addLog(logText.trim());
    setLogText("");
  }

  function printReport() {
    setTab("reporte");
    window.setTimeout(() => window.print(), 250);
  }

  return (
    <div className="app">
      <header>
        <div className="brand">
          <img className="brand-logo" src="/logo-ugred.jpg" alt="Logo UGRED San José de Maipo"/>
          <div><strong>UGRED · SAN JOSÉ DE MAIPO</strong><span>Tablero digital de incidentes · Departamento de Salud</span></div>
        </div>
        <nav>
          <button onClick={() => setTab("tablero")} className={tab === "tablero" ? "active" : ""}>Tablero</button>
          <button onClick={() => setTab("recursos")} className={tab === "recursos" ? "active" : ""}>Recursos</button>
          <button onClick={() => setTab("bitacora")} className={tab === "bitacora" ? "active" : ""}>Bitácora</button>
          <button onClick={() => setTab("reporte")} className={tab === "reporte" ? "active" : ""}>Reporte</button>
        </nav>
        <div className="sync"><Database size={15}/>{syncState}</div>
      </header>

      {tab === "tablero" && (
        <main>
          <section className="hero card">
            <div>
              <span className={`level level-${incident.level.toLowerCase()}`}>{incident.level}</span>
              <h1>{incident.name}</h1>
              <p>{incident.type} · {incident.location}</p>
            </div>
            <div className="hero-actions">
              <button className="secondary" onClick={() => setEditingIncident(true)}><Edit3 size={17}/>Editar incidente</button>
              <button onClick={createNewIncident}><Plus size={17}/>Nuevo incidente</button>
            </div>
          </section>

          <section className="stats">
            <div className="card"><small>Evaluadas</small><strong>{incident.evaluated}</strong></div>
            <div className="card"><small>Lesionados</small><strong>{incident.injured}</strong></div>
            <div className="card"><small>Trasladados</small><strong>{incident.transferred}</strong></div>
            <div className="card"><small>Aislados</small><strong>{incident.isolated}</strong></div>
          </section>

          <section className="grid2">
            <article className="card">
              <h2><AlertTriangle size={20}/>Situación operativa</h2>
              <label>Situación actual<textarea value={incident.situation} onChange={e => setIncident({...incident, situation: e.target.value})}/></label>
              <label>Riesgos<textarea value={incident.risks} onChange={e => setIncident({...incident, risks: e.target.value})}/></label>
              <label>Servicios críticos<textarea value={incident.criticalServices} onChange={e => setIncident({...incident, criticalServices: e.target.value})}/></label>
            </article>

            <article className="card">
              <div className="title-row"><h2><ClipboardList size={20}/>Plan de acción</h2><button onClick={() => setTaskModal(true)}><Plus size={16}/>Tarea</button></div>
              {tasks.length === 0 ? <p className="empty">No hay tareas registradas.</p> :
                <div className="task-list">{tasks.map(task => (
                  <div className="task" key={task.id}>
                    <div><strong>{task.objective}</strong><span>{task.action}</span><small>{task.responsible} · {task.priority} · {task.deadline || "Sin plazo"}</small></div>
                    <select value={task.status} onChange={e => {
                      const status = e.target.value as Task["status"];
                      setTasks(ts => ts.map(t => t.id === task.id ? {...t, status} : t));
                      addLog(`Tarea “${task.objective}” cambió a ${status}.`);
                    }}>
                      <option>Pendiente</option><option>En curso</option><option>Cumplida</option>
                    </select>
                  </div>
                ))}</div>}
            </article>
          </section>

          <section className="card">
            <div className="title-row"><h2><Truck size={20}/>Recursos desplegados</h2><button onClick={() => setResourceModal(true)}><Plus size={16}/>Agregar</button></div>
            <div className="resource-grid">
              {resources.slice(0, 8).map(resource => (
                <article className="resource" key={resource.id}>
                  <div><b>{resource.code}</b><span>{resource.name}</span></div>
                  <small>{resource.location} · {resource.responsible}</small>
                  <input value={resource.assignment} onChange={e => setResources(rs => rs.map(r => r.id === resource.id ? {...r, assignment: e.target.value} : r))}/>
                  <select value={resource.status} onChange={e => changeResourceStatus(resource, e.target.value as ResourceStatus)}>
                    {resourceStatuses.map(s => <option key={s}>{s}</option>)}
                  </select>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}

      {tab === "recursos" && (
        <main>
          <section className="card">
            <div className="title-row"><div><h1>Catálogo de recursos</h1><p>Recursos permanentes y eventuales.</p></div><button onClick={() => setResourceModal(true)}><Plus size={17}/>Nuevo recurso</button></div>
            <div className="table-wrap"><table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Cantidad</th><th>Responsable</th><th>Ubicación</th><th>Estado</th><th></th></tr></thead>
              <tbody>{resources.map(r => <tr key={r.id}>
                <td>{r.code}</td><td>{r.name}</td><td>{r.type}</td><td>{r.quantity}</td><td>{r.responsible}</td><td>{r.location}</td>
                <td><select value={r.status} onChange={e => changeResourceStatus(r, e.target.value as ResourceStatus)}>{resourceStatuses.map(s => <option key={s}>{s}</option>)}</select></td>
                <td><button className="icon danger" onClick={() => {setResources(x => x.filter(i => i.id !== r.id)); addLog(`Recurso ${r.code} eliminado.`)}}><Trash2 size={16}/></button></td>
              </tr>)}</tbody>
            </table></div>
          </section>
        </main>
      )}

      {tab === "bitacora" && (
        <main>
          <section className="card">
            <h1>Bitácora del incidente</h1>
            <div className="log-entry"><input value={logText} onChange={e => setLogText(e.target.value)} placeholder="Escriba un evento operacional…"/><button onClick={addManualLog}><Plus size={17}/>Registrar</button></div>
            <div className="timeline">{[...log].reverse().map(item => (
              <div key={item.id}><time>{new Date(item.createdAt).toLocaleString("es-CL")}</time><p>{item.description}</p></div>
            ))}</div>
          </section>
        </main>
      )}

      {tab === "reporte" && (
        <main className="report">
          <section className="card">
            <div className="title-row no-print"><h1>Reporte SITREP</h1><button onClick={printReport}><FileText size={17}/>Imprimir / Guardar PDF</button></div>
            <div className="report-head"><ShieldCheck size={42}/><div><h1>SITREP · {incident.name}</h1><p>Emitido: {nowText()}</p></div></div>
            <h2>1. Identificación</h2>
            <dl className="report-grid">
              <div><dt>Tipo</dt><dd>{incident.type}</dd></div><div><dt>Ubicación</dt><dd>{incident.location}</dd></div>
              <div><dt>Nivel</dt><dd>{incident.level}</dd></div><div><dt>Comandante</dt><dd>{incident.commander}</dd></div>
              <div><dt>Inicio</dt><dd>{incident.startedAt.replace("T", " ")}</dd></div><div><dt>Estado</dt><dd>{incident.status}</dd></div>
            </dl>
            <h2>2. Situación</h2><p>{incident.situation}</p>
            <h2>3. Riesgos</h2><p>{incident.risks}</p>
            <h2>4. Servicios críticos</h2><p>{incident.criticalServices}</p>
            <h2>5. Objetivo general</h2><p>{incident.objective}</p>
            <h2>6. Personas afectadas</h2>
            <p>Evaluadas: {incident.evaluated} · Lesionados: {incident.injured} · Trasladados: {incident.transferred} · Aislados: {incident.isolated}</p>
            <h2>7. Recursos</h2>
            <ul>{resources.filter(r => !["Disponible","Liberado"].includes(r.status)).map(r => <li key={r.id}>{r.code} · {r.name} · {r.status} · {r.assignment}</li>)}</ul>
            <h2>8. Tareas</h2>
            <ul>{tasks.map(t => <li key={t.id}>{t.objective} — {t.responsible} — {t.status}</li>)}</ul>
            <h2>9. Últimos eventos</h2>
            <ul>{log.slice(-12).map(l => <li key={l.id}>{new Date(l.createdAt).toLocaleString("es-CL")} — {l.description}</li>)}</ul>
          </section>
        </main>
      )}

      <footer>
        <button onClick={() => setTab("bitacora")}><BookOpenText size={17}/>Registrar evento</button>
        <button onClick={printReport}><FileText size={17}/>Generar SITREP</button>
        <button className="secondary" onClick={() => saveLocal(data)}><Save size={17}/>Guardar</button>
      </footer>

      {editingIncident && <Modal title="Editar incidente" onClose={() => setEditingIncident(false)}>
        <div className="form-grid">
          <label>Nombre<input value={incident.name} onChange={e => setIncident({...incident, name:e.target.value})}/></label>
          <label>Tipo<input value={incident.type} onChange={e => setIncident({...incident, type:e.target.value})}/></label>
          <label>Ubicación<input value={incident.location} onChange={e => setIncident({...incident, location:e.target.value})}/></label>
          <label>Comandante<input value={incident.commander} onChange={e => setIncident({...incident, commander:e.target.value})}/></label>
          <label>Nivel<select value={incident.level} onChange={e => setIncident({...incident, level:e.target.value as Incident["level"]})}><option>VERDE</option><option>AMARILLO</option><option>ROJO</option></select></label>
          <label>Estado<select value={incident.status} onChange={e => setIncident({...incident, status:e.target.value as Incident["status"]})}><option>Activo</option><option>Cerrado</option></select></label>
          <label className="wide">Objetivo general<textarea value={incident.objective} onChange={e => setIncident({...incident, objective:e.target.value})}/></label>
          {(["evaluated","injured","transferred","isolated"] as const).map(k => <label key={k}>{k}<input type="number" min="0" value={incident[k]} onChange={e => setIncident({...incident,[k]:Number(e.target.value)})}/></label>)}
        </div>
        <button onClick={() => {setEditingIncident(false); addLog("Datos generales del incidente actualizados.");}}><Check size={17}/>Guardar cambios</button>
      </Modal>}

      {resourceModal && <Modal title="Agregar recurso" onClose={() => setResourceModal(false)}>
        <form onSubmit={e => {e.preventDefault(); addResource(e.currentTarget)}} className="form-grid">
          <label>Código<input name="code" required/></label><label>Nombre<input name="name" required/></label>
          <label>Tipo<select name="type"><option>Vehículo</option><option>Personal</option><option>Equipo</option><option>Comunicaciones</option><option>Insumo</option></select></label>
          <label>Cantidad<input name="quantity" type="number" min="1" defaultValue="1"/></label>
          <label>Responsable<input name="responsible"/></label><label>Ubicación<input name="location"/></label>
          <label className="wide">Misión / asignación<input name="assignment"/></label>
          <button type="submit"><Plus size={17}/>Agregar</button>
        </form>
      </Modal>}

      {taskModal && <Modal title="Nueva tarea" onClose={() => setTaskModal(false)}>
        <form onSubmit={e => {e.preventDefault(); addTask(e.currentTarget)}} className="form-grid">
          <label className="wide">Objetivo<input name="objective" required/></label>
          <label className="wide">Acción concreta<input name="action" required/></label>
          <label>Responsable<input name="responsible" required/></label>
          <label>Prioridad<select name="priority"><option>Alta</option><option>Media</option><option>Baja</option></select></label>
          <label>Plazo<input name="deadline" type="datetime-local"/></label>
          <button type="submit"><Plus size={17}/>Crear tarea</button>
        </form>
      </Modal>}
    </div>
  );
}

function Modal({title, onClose, children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return <div className="modal-bg"><div className="modal"><button className="close" onClick={onClose}><X/></button><h2>{title}</h2>{children}</div></div>
}

export default App;
