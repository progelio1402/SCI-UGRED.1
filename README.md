# SCI UGRED San José de Maipo — versión funcional

Aplicación web React/Vite para gestión de incidentes de la UGRED del Departamento de Salud de San José de Maipo.

## Funciones incluidas

- Edición del incidente activo.
- Nivel de alerta y estado operativo.
- Registro de situación, riesgos y servicios críticos.
- Gestión de tareas y responsables.
- Catálogo y despliegue de recursos.
- Bitácora cronológica.
- Reporte SITREP imprimible.
- Guardado local automático.
- Sincronización opcional con Supabase mediante `app_state`.
- Identidad visual UGRED incorporada.

## Variables de entorno

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`

Después de reemplazar los archivos en GitHub, Netlify desplegará automáticamente.
