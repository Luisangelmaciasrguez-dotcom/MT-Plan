-- =====================================================================
--  Nuestra App — esquema de base de datos (Supabase / PostgreSQL)
--  Cópialo completo en Supabase → SQL Editor → New query → Run.
-- =====================================================================

-- Tabla: cada "espacio" es una contraseña compartida con todos sus datos.
create table if not exists public.spaces (
  code       text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.spaces enable row level security;
-- No damos acceso directo a la tabla: solo se entra por las funciones de abajo,
-- que exigen conocer la contraseña. Así nadie puede listar los datos de otros.

-- Leer los datos de un espacio (necesitas la contraseña exacta).
create or replace function public.get_space(p_code text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select data from public.spaces where code = p_code;
$$;

-- Guardar (crea o actualiza) los datos de un espacio.
create or replace function public.save_space(p_code text, p_data jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.spaces (code, data, updated_at)
  values (p_code, p_data, now())
  on conflict (code) do update
    set data = excluded.data, updated_at = now();
$$;

-- Permitir que la app (clave anónima) use solo estas dos funciones.
grant execute on function public.get_space(text) to anon;
grant execute on function public.save_space(text, jsonb) to anon;
