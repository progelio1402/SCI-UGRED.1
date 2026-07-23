# Tablero de Incidentes UGRED

Primera versión funcional de una maleta de comando digital para la UGRED del Departamento de Salud de San José de Maipo.

## Incluye

- Tablero responsive estilo maleta de comando.
- Recursos asignados al incidente.
- Filtros por tipo de recurso.
- Cambio de estado con registro automático en bitácora.
- Incorporación de recursos eventuales.
- Organización, áreas de trabajo, objetivos y estado de escena.
- Estructura inicial de Supabase.
- Configuración lista para Netlify.

## Ejecutar localmente

1. Instalar Node.js 20 o superior.
2. Abrir una terminal en esta carpeta.
3. Ejecutar:

```bash
npm install
npm run dev
```

4. Abrir la dirección que muestra Vite, normalmente `http://localhost:5173`.

## Conectar Supabase

1. Copiar `.env.example` como `.env`.
2. Completar:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

3. En Supabase, abrir **SQL Editor**.
4. Ejecutar `supabase/schema.sql`.
5. Luego ejecutar `supabase/seed.sql`.

La interfaz actual usa datos locales simulados. El siguiente desarrollo reemplazará esos datos por consultas y suscripciones Realtime de Supabase.

## Subir a GitHub

1. Crear un repositorio vacío llamado `tablero-incidentes-ugred`.
2. Desde esta carpeta:

```bash
git init
git add .
git commit -m "Primera versión del tablero UGRED"
git branch -M main
git remote add origin URL_DEL_REPOSITORIO
git push -u origin main
```

## Publicar en Netlify

1. Ingresar a Netlify.
2. Elegir **Add new site → Import an existing project**.
3. Seleccionar GitHub y el repositorio.
4. Build command: `npm run build`.
5. Publish directory: `dist`.
6. Agregar las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
7. Publicar.
