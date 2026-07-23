# SCI UGRED Profesional v2

Tablero digital de comando de incidentes para UGRED San José de Maipo.

## Incluye
- Dashboard consolidado con hora actual y duración del incidente.
- Gestión del incidente, comando y plan de acción.
- Recursos y personal precargados con roles.
- Tarjetas de recursos coloreadas según estado.
- Registro de pacientes: sexo, ciclo vital, nombre, RUT, condición, destino y observaciones.
- Línea de tiempo operacional.
- SITREP imprimible / exportable a PDF.
- Guardado local y sincronización opcional con Supabase.

## Instalación
1. `npm install`
2. Copiar `.env.example` como `.env` y completar credenciales para uso local.
3. `npm run dev`

## Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

## Seguridad
La política SQL incluida permite acceso público para pruebas. Antes de registrar información real o sensible, implementar autenticación y políticas RLS por usuario/rol.
