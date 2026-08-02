-- ==============================================================================
-- MIGRACIÓN: LÍMITES Y FEATURE FLAGS DE IA GENERATIVA PARA LANZAMIENTO
-- ==============================================================================

-- 1. Tabla de Feature Flags
create table if not exists feature_flags (
  nombre text primary key,
  activo boolean not null default true,
  actualizado_en timestamptz not null default now()
);

-- 2. Tabla de Límites de Features
create table if not exists limites_features (
  feature text not null,
  limite integer not null,
  periodo text not null check (periodo in ('dia', 'semana', 'mes')),
  alcance text not null default 'global' check (alcance in ('global', 'por_usuario')),
  primary key (feature, alcance)
);

-- 3. Habilitar RLS y otorgar permisos
alter table feature_flags enable row level security;
alter table limites_features enable row level security;

grant all on table feature_flags to postgres, service_role, anon, authenticated;
grant all on table limites_features to postgres, service_role, anon, authenticated;

drop policy if exists "feature_flags_select_all" on feature_flags;
create policy "feature_flags_select_all" on feature_flags for select using (true);

drop policy if exists "limites_features_select_all" on limites_features;
create policy "limites_features_select_all" on limites_features for select using (true);

-- 4. Datos semilla de Feature Flags
insert into feature_flags (nombre, activo) values
  ('extraccion_cv', true),
  ('quiz_skill', true),
  ('simulacion_entrevista', true),
  ('adaptacion_cv', false),
  ('generacion_bio', false),
  ('boost_oferta', false)
on conflict (nombre) do update set activo = excluded.activo, actualizado_en = now();

-- 5. Datos semilla de Límites de Features
insert into limites_features (feature, limite, periodo, alcance) values
  ('extraccion_cv', 5, 'mes', 'por_usuario'),
  ('quiz_skill', 5, 'mes', 'por_usuario'),
  ('simulacion_entrevista_por_oferta', 1, 'mes', 'por_usuario'),
  ('simulacion_max_output_tokens', 350, 'mes', 'global'),
  ('simulacion_max_input_chars', 600, 'mes', 'global')
on conflict (feature, alcance) do update set limite = excluded.limite, periodo = excluded.periodo;
