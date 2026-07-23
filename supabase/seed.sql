insert into public.resource_catalog (code, name, resource_type, institution, home_location)
values
  ('A-01', 'Ambulancia básica', 'Vehículo', 'Departamento de Salud', 'PSR Las Vertientes'),
  ('V-01', 'Camioneta UGRED 4x4', 'Vehículo', 'Departamento de Salud', 'PSR Las Vertientes'),
  ('RAD-03', 'Radio portátil', 'Comunicaciones', 'UGRED Salud', 'Puesto de comando'),
  ('GEN-01', 'Generador 5 kVA', 'Equipo', 'Departamento de Salud', 'PSR San Gabriel')
on conflict (code) do nothing;
