import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BookOpenText,
  Check,
  ClipboardList,
  Database,
  Edit3,
  FileText,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  X
} from "lucide-react";

import type {
  Incident,
  LogEntry,
  Resource,
  ResourceStatus,
  Task
} from "./types";

import { loadLocal, saveLocal, type AppData } from "./storage";
import {
  loadRemote,
  saveRemote,
  supabaseConfigured
} from "./supabase";

const resourceStatuses: ResourceStatus[] = [
  "Disponible",
  "Asignado",
  "En tránsito",
  "En operación",
  "Fuera de servicio",
  "Liberado"
];

function nowText() {
  return new Date().toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function App() {
  const initial = loadLocal();

  const [incident, setIncident] = useState<Incident>(initial.incident);
  const [resources, setResources] = useState<Resource[]>(initial.resources);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [log, setLog] = useState<LogEntry[]>(initial.log);

  const [tab, setTab] = useState<
    "tablero" | "recursos" | "bitacora" | "reporte"
  >("tablero");

  const [editingIncident, setEditingIncident] = useState(false);
  const [resourceModal, setResourceModal] = useState(false);
  const [taskModal, setTaskModal] = useState(false);
  const [logText, setLogText] = useState("");
  const [syncState, setSyncState] = useState("Guardado localmente");

  const data: AppData = useMemo(
    () => ({
      incident,
      resources,
      tasks,
      log
    }),
    [incident, resources, tasks, log]
  );

  useEffect(() => {
    saveLocal(data);
    setSyncState("Guardado localmente");

    const timeout = window.setTimeout(async () => {
      if (!supabaseConfigured) {
        setSyncState("Guardado localmente");
        return;
      }

      try {
        await saveRemote(data);
        setSyncState("Sincronizado con Supabase");
      } catch {
        setSyncState("Guardado local; Supabase no disponible");
      }
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [data]);

  useEffect(() => {
    if (!supabaseConfigured) {
      setSyncState("Supabase no configurado");
      return;
    }

    loadRemote()
      .then((remote) => {
        if (!remote) {
          setSyncState("Sin datos remotos; usando datos locales");
          return;
        }

        setIncident(remote.incident);
        setResources(remote.resources);
        setTasks(remote.tasks);
        setLog(remote.log);
        setSyncState("Datos cargados desde Supabase");
      })
      .catch(() => {
        setSyncState("Usando almacenamiento local");
      });
  }, []);

  function addLog(description: string) {
    setLog((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        description
      }
    ]);
  }

  function createNewIncident() {
    const confirmed = window.confirm(
      "¿Crear un nuevo incidente? Se reemplazará el incidente actual."
    );

    if (!confirmed) return;

    const fresh: Incident = {
      ...incident,
      id: crypto.randomUUID(),
      name: "Nuevo incidente",
      type: "Emergencia comunal",
      location: "San José de Maipo",
      detail: "",
      objective:
        "Proteger la vida y mantener la continuidad de la red de salud.",
      situation: "Pendiente de evaluación inicial.",
      risks: "Sin riesgos registrados.",
      criticalServices: "Sin afectación informada.",
      level: "VERDE",
      status: "Activo",
      startedAt: new Date().toISOString().slice(0, 16),
      evaluated: 0,
      injured: 0,
      transferred: 0,
      isolated: 0
    };

    setIncident(fresh);
    setTasks([]);
    setLog([
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        description: "Nuevo incidente creado."
      }
    ]);
    setTab("tablero");
  }

  function addResource(form: HTMLFormElement) {
    const formData = new FormData(form);

    const resource: Resource = {
      id: crypto.randomUUID(),
      code: String(formData.get("code") ?? ""),
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type")) as Resource["type"],
      status: "Disponible",
      responsible: String(formData.get("responsible") || "Sin asignar"),
      location: String(formData.get("location") || "Puesto de comando"),
      assignment: String(formData.get("assignment") || "Sin asignar"),
      quantity: Number(formData.get("quantity") || 1),
      updatedAt: new Date().toISOString()
    };

    setResources((current) => [...current, resource]);
    addLog(`Recurso ${resource.code} · ${resource.name} incorporado.`);
    setResourceModal(false);
  }

  function changeResourceStatus(
    resource: Resource,
    status: ResourceStatus
  ) {
    setResources((items) =>
      items.map((item) =>
        item.id === resource.id
          ? {
              ...item,
              status,
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );

    addLog(
      `${resource.code} cambió de ${resource.status} a ${status}.`
    );
  }

  function addTask(form: HTMLFormElement) {
    const formData = new FormData(form);

    const task: Task = {
      id: crypto.randomUUID(),
      objective: String(formData.get("objective") ?? ""),
      action: String(formData.get("action") ?? ""),
      responsible: String(formData.get("responsible") ?? ""),
      priority: String(formData.get("priority")) as Task["priority"],
      status: "Pendiente",
      deadline: String(formData.get("deadline") || "")
    };

    setTasks((current) => [...current, task]);
    addLog(`Nueva tarea asignada a ${task.responsible}.`);
    setTaskModal(false);
  }

  function addManualLog() {
    const description = logText.trim();

    if (!description) return;

    addLog(description);
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
          <img
            className="brand-logo"
            src="/logo-ugred.jpg"
            alt="Logo UGRED San José de Maipo"
          />

          <div>
            <strong>UGRED · SAN JOSÉ DE MAIPO</strong>
            <span>
              Tablero digital de incidentes · Departamento de Salud
            </span>
          </div>
        </div>

        <nav>
          <button
            type="button"
            onClick={() => setTab("tablero")}
            className={tab === "tablero" ? "active" : ""}
          >
            Tablero
          </button>

          <button
            type="button"
            onClick={() => setTab("recursos")}
            className={tab === "recursos" ? "active" : ""}
          >
            Recursos
          </button>

          <button
            type="button"
            onClick={() => setTab("bitacora")}
            className={tab === "bitacora" ? "active" : ""}
          >
            Bitácora
          </button>

          <button
            type="button"
            onClick={() => setTab("reporte")}
            className={tab === "reporte" ? "active" : ""}
          >
            Reporte
          </button>
        </nav>

        <div className="sync">
          <Database size={15} />
          {syncState}
        </div>
      </header>

      {tab === "tablero" && (
        <main>
          <section className="hero card">
            <div>
              <span
                className={`level level-${incident.level.toLowerCase()}`}
              >
                {incident.level}
              </span>

              <h1>{incident.name}</h1>

              <p>
                {incident.type} · {incident.location}
              </p>
            </div>

            <div className="hero-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditingIncident(true)}
              >
                <Edit3 size={17} />
                Editar incidente
              </button>

              <button type="button" onClick={createNewIncident}>
                <Plus size={17} />
                Nuevo incidente
              </button>
            </div>
          </section>

          <section className="stats">
            <div className="card">
              <small>Evaluadas</small>
              <strong>{incident.evaluated}</strong>
            </div>

            <div className="card">
              <small>Lesionados</small>
              <strong>{incident.injured}</strong>
            </div>

            <div className="card">
              <small>Trasladados</small>
              <strong>{incident.transferred}</strong>
            </div>

            <div className="card">
              <small>Aislados</small>
              <strong>{incident.isolated}</strong>
            </div>
          </section>

          <section className="grid2">
            <article className="card">
              <h2>
                <AlertTriangle size={20} />
                Situación operativa
              </h2>

              <label>
                Situación actual
                <textarea
                  value={incident.situation}
                  onChange={(event) =>
                    setIncident({
                      ...incident,
                      situation: event.target.value
                    })
                  }
                />
              </label>

              <label>
                Riesgos
                <textarea
                  value={incident.risks}
                  onChange={(event) =>
                    setIncident({
                      ...incident,
                      risks: event.target.value
                    })
                  }
                />
              </label>

              <label>
                Servicios críticos
                <textarea
                  value={incident.criticalServices}
                  onChange={(event) =>
                    setIncident({
                      ...incident,
                      criticalServices: event.target.value
                    })
                  }
                />
              </label>
            </article>

            <article className="card">
              <div className="title-row">
                <h2>
                  <ClipboardList size={20} />
                  Plan de acción
                </h2>

                <button
                  type="button"
                  onClick={() => setTaskModal(true)}
                >
                  <Plus size={16} />
                  Tarea
                </button>
              </div>

              {tasks.length === 0 ? (
                <p className="empty">No hay tareas registradas.</p>
              ) : (
                <div className="task-list">
                  {tasks.map((task) => (
                    <div className="task" key={task.id}>
                      <div>
                        <strong>{task.objective}</strong>
                        <span>{task.action}</span>
                        <small>
                          {task.responsible} · {task.priority} ·{" "}
                          {task.deadline || "Sin plazo"}
                        </small>
                      </div>

                      <select
                        value={task.status}
                        onChange={(event) => {
                          const status =
                            event.target.value as Task["status"];

                          setTasks((current) =>
                            current.map((item) =>
                              item.id === task.id
                                ? {
                                    ...item,
                                    status
                                  }
                                : item
                            )
                          );

                          addLog(
                            `Tarea “${task.objective}” cambió a ${status}.`
                          );
                        }}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En curso">En curso</option>
                        <option value="Cumplida">Cumplida</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="card">
            <div className="title-row">
              <h2>
                <Truck size={20} />
                Recursos desplegados
              </h2>

              <button
                type="button"
                onClick={() => setResourceModal(true)}
              >
                <Plus size={16} />
                Agregar
              </button>
            </div>

            <div className="resource-grid">
              {resources.slice(0, 8).map((resource) => (
                <article className="resource" key={resource.id}>
                  <div>
                    <b>{resource.code}</b>
                    <span>{resource.name}</span>
                  </div>

                  <small>
                    {resource.location} · {resource.responsible}
                  </small>

                  <input
                    value={resource.assignment}
                    onChange={(event) =>
                      setResources((current) =>
                        current.map((item) =>
                          item.id === resource.id
                            ? {
                                ...item,
                                assignment: event.target.value,
                                updatedAt: new Date().toISOString()
                              }
                            : item
                        )
                      )
                    }
                  />

                  <select
                    value={resource.status}
                    onChange={(event) =>
                      changeResourceStatus(
                        resource,
                        event.target.value as ResourceStatus
                      )
                    }
                  >
                    {resourceStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
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
            <div className="title-row">
              <div>
                <h1>Catálogo de recursos</h1>
                <p>Recursos permanentes y eventuales.</p>
              </div>

              <button
                type="button"
                onClick={() => setResourceModal(true)}
              >
                <Plus size={17} />
                Nuevo recurso
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Responsable</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id}>
                      <td>{resource.code}</td>
                      <td>{resource.name}</td>
                      <td>{resource.type}</td>
                      <td>{resource.quantity}</td>
                      <td>{resource.responsible}</td>
                      <td>{resource.location}</td>

                      <td>
                        <select
                          value={resource.status}
                          onChange={(event) =>
                            changeResourceStatus(
                              resource,
                              event.target.value as ResourceStatus
                            )
                          }
                        >
                          {resourceStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="icon danger"
                          aria-label={`Eliminar ${resource.name}`}
                          onClick={() => {
                            const confirmed = window.confirm(
                              `¿Eliminar el recurso ${resource.code} · ${resource.name}?`
                            );

                            if (!confirmed) return;

                            setResources((current) =>
                              current.filter(
                                (item) => item.id !== resource.id
                              )
                            );

                            addLog(
                              `Recurso ${resource.code} eliminado.`
                            );
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      {tab === "bitacora" && (
        <main>
          <section className="card">
            <h1>Bitácora del incidente</h1>

            <div className="log-entry">
              <input
                value={logText}
                onChange={(event) => setLogText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addManualLog();
                  }
                }}
                placeholder="Escriba un evento operacional…"
              />

              <button type="button" onClick={addManualLog}>
                <Plus size={17} />
                Registrar
              </button>
            </div>

            <div className="timeline">
              {[...log].reverse().map((item) => (
                <div key={item.id}>
                  <time>
                    {new Date(item.createdAt).toLocaleString("es-CL")}
                  </time>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {tab === "reporte" && (
        <main className="report">
          <section className="card">
            <div className="title-row no-print">
              <h1>Reporte SITREP</h1>

              <button type="button" onClick={printReport}>
                <FileText size={17} />
                Imprimir / Guardar PDF
              </button>
            </div>

            <div className="report-head">
              <ShieldCheck size={42} />

              <div>
                <h1>SITREP · {incident.name}</h1>
                <p>Emitido: {nowText()}</p>
              </div>
            </div>

            <h2>1. Identificación</h2>

            <dl className="report-grid">
              <div>
                <dt>Tipo</dt>
                <dd>{incident.type}</dd>
              </div>

              <div>
                <dt>Ubicación</dt>
                <dd>{incident.location}</dd>
              </div>

              <div>
                <dt>Nivel</dt>
                <dd>{incident.level}</dd>
              </div>

              <div>
                <dt>Comandante</dt>
                <dd>{incident.commander}</dd>
              </div>

              <div>
                <dt>Inicio</dt>
                <dd>{incident.startedAt.replace("T", " ")}</dd>
              </div>

              <div>
                <dt>Estado</dt>
                <dd>{incident.status}</dd>
              </div>
            </dl>

            <h2>2. Situación</h2>
            <p>{incident.situation}</p>

            <h2>3. Riesgos</h2>
            <p>{incident.risks}</p>

            <h2>4. Servicios críticos</h2>
            <p>{incident.criticalServices}</p>

            <h2>5. Objetivo general</h2>
            <p>{incident.objective}</p>

            <h2>6. Personas afectadas</h2>
            <p>
              Evaluadas: {incident.evaluated} · Lesionados:{" "}
              {incident.injured} · Trasladados:{" "}
              {incident.transferred} · Aislados: {incident.isolated}
            </p>

            <h2>7. Recursos desplegados</h2>

            {resources.filter(
              (resource) =>
                resource.status !== "Disponible" &&
                resource.status !== "Liberado"
            ).length === 0 ? (
              <p>No hay recursos desplegados registrados.</p>
            ) : (
              <ul>
                {resources
                  .filter(
                    (resource) =>
                      resource.status !== "Disponible" &&
                      resource.status !== "Liberado"
                  )
                  .map((resource) => (
                    <li key={resource.id}>
                      {resource.code} · {resource.name} ·{" "}
                      {resource.status} · {resource.assignment}
                    </li>
                  ))}
              </ul>
            )}

            <h2>8. Plan de acción</h2>

            {tasks.length === 0 ? (
              <p>No hay tareas registradas.</p>
            ) : (
              <ul>
                {tasks.map((task) => (
                  <li key={task.id}>
                    {task.objective} — {task.responsible} —{" "}
                    {task.status}
                  </li>
                ))}
              </ul>
            )}

            <h2>9. Últimos eventos</h2>

            {log.length === 0 ? (
              <p>No hay eventos registrados.</p>
            ) : (
              <ul>
                {log.slice(-12).map((entry) => (
                  <li key={entry.id}>
                    {new Date(entry.createdAt).toLocaleString(
                      "es-CL"
                    )}{" "}
                    — {entry.description}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      )}

      <footer>
        <button
          type="button"
          onClick={() => setTab("bitacora")}
        >
          <BookOpenText size={17} />
          Registrar evento
        </button>

        <button type="button" onClick={printReport}>
          <FileText size={17} />
          Generar SITREP
        </button>

        <button
          type="button"
          className="secondary"
          onClick={() => {
            saveLocal(data);
            setSyncState("Guardado manualmente");
          }}
        >
          <Save size={17} />
          Guardar
        </button>
      </footer>

      {editingIncident && (
        <Modal
          title="Editar incidente"
          onClose={() => setEditingIncident(false)}
        >
          <div className="form-grid">
            <label>
              Nombre
              <input
                value={incident.name}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    name: event.target.value
                  })
                }
              />
            </label>

            <label>
              Tipo
              <input
                value={incident.type}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    type: event.target.value
                  })
                }
              />
            </label>

            <label>
              Ubicación
              <input
                value={incident.location}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    location: event.target.value
                  })
                }
              />
            </label>

            <label>
              Comandante
              <input
                value={incident.commander}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    commander: event.target.value
                  })
                }
              />
            </label>

            <label>
              Inicio
              <input
                type="datetime-local"
                value={incident.startedAt}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    startedAt: event.target.value
                  })
                }
              />
            </label>

            <label>
              Nivel
              <select
                value={incident.level}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    level: event.target.value as Incident["level"]
                  })
                }
              >
                <option value="VERDE">VERDE</option>
                <option value="AMARILLO">AMARILLO</option>
                <option value="ROJO">ROJO</option>
              </select>
            </label>

            <label>
              Estado
              <select
                value={incident.status}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    status: event.target.value as Incident["status"]
                  })
                }
              >
                <option value="Activo">Activo</option>
                <option value="Cerrado">Cerrado</option>
              </select>
            </label>

            <label className="wide">
              Detalle
              <textarea
                value={incident.detail}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    detail: event.target.value
                  })
                }
              />
            </label>

            <label className="wide">
              Objetivo general
              <textarea
                value={incident.objective}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    objective: event.target.value
                  })
                }
              />
            </label>

            <label>
              Personas evaluadas
              <input
                type="number"
                min="0"
                value={incident.evaluated}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    evaluated: Number(event.target.value)
                  })
                }
              />
            </label>

            <label>
              Lesionados
              <input
                type="number"
                min="0"
                value={incident.injured}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    injured: Number(event.target.value)
                  })
                }
              />
            </label>

            <label>
              Trasladados
              <input
                type="number"
                min="0"
                value={incident.transferred}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    transferred: Number(event.target.value)
                  })
                }
              />
            </label>

            <label>
              Aislados
              <input
                type="number"
                min="0"
                value={incident.isolated}
                onChange={(event) =>
                  setIncident({
                    ...incident,
                    isolated: Number(event.target.value)
                  })
                }
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingIncident(false);
              addLog(
                "Datos generales del incidente actualizados."
              );
            }}
          >
            <Check size={17} />
            Guardar cambios
          </button>
        </Modal>
      )}

      {resourceModal && (
        <Modal
          title="Agregar recurso"
          onClose={() => setResourceModal(false)}
        >
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              addResource(event.currentTarget);
            }}
          >
            <label>
              Código
              <input name="code" required />
            </label>

            <label>
              Nombre
              <input name="name" required />
            </label>

            <label>
              Tipo
              <select name="type" defaultValue="Vehículo">
                <option value="Vehículo">Vehículo</option>
                <option value="Personal">Personal</option>
                <option value="Equipo">Equipo</option>
                <option value="Comunicaciones">
                  Comunicaciones
                </option>
                <option value="Insumo">Insumo</option>
              </select>
            </label>

            <label>
              Cantidad
              <input
                name="quantity"
                type="number"
                min="1"
                defaultValue="1"
              />
            </label>

            <label>
              Responsable
              <input name="responsible" />
            </label>

            <label>
              Ubicación
              <input name="location" />
            </label>

            <label className="wide">
              Misión o asignación
              <input name="assignment" />
            </label>

            <button type="submit">
              <Plus size={17} />
              Agregar
            </button>
          </form>
        </Modal>
      )}

      {taskModal && (
        <Modal
          title="Nueva tarea"
          onClose={() => setTaskModal(false)}
        >
          <form
            className="form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              addTask(event.currentTarget);
            }}
          >
            <label className="wide">
              Objetivo
              <input name="objective" required />
            </label>

            <label className="wide">
              Acción concreta
              <input name="action" required />
            </label>

            <label>
              Responsable
              <input name="responsible" required />
            </label>

            <label>
              Prioridad
              <select name="priority" defaultValue="Media">
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </label>

            <label>
              Plazo
              <input name="deadline" type="datetime-local" />
            </label>

            <button type="submit">
              <Plus size={17} />
              Crear tarea
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function Modal({
  title,
  onClose,
  children
}: ModalProps) {
  return (
    <div
      className="modal-bg"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          type="button"
          className="close"
          onClick={onClose}
          aria-label="Cerrar ventana"
        >
          <X />
        </button>

        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default App;
