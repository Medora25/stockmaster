drop table if exists public.app_state;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.create_payload_table(table_name text)
returns void
language plpgsql
as $$
begin
  execute format(
    'create table if not exists public.%I (
      id text not null,
      payload jsonb not null,
      created_at timestamptz not null default timezone(''utc'', now()),
      updated_at timestamptz not null default timezone(''utc'', now())
    )',
    table_name
  );

  perform 1
  from pg_constraint c
  join pg_class cl on cl.oid = c.conrelid
  join pg_namespace n on n.oid = cl.relnamespace
  where n.nspname = 'public'
    and cl.relname = table_name
    and c.contype = 'p';

  if found then
    execute format(
      'alter table public.%I drop constraint %I',
      table_name,
      (
        select c.conname
        from pg_constraint c
        join pg_class cl on cl.oid = c.conrelid
        join pg_namespace n on n.oid = cl.relnamespace
        where n.nspname = 'public'
          and cl.relname = table_name
          and c.contype = 'p'
        limit 1
      )
    );
  end if;

  execute format('drop trigger if exists trg_%I_updated_at on public.%I', table_name, table_name);

  execute format(
    'create trigger trg_%I_updated_at
      before update on public.%I
      for each row
      execute function public.touch_updated_at()',
    table_name,
    table_name
  );

  execute format(
    'alter table public.%I
      add column if not exists user_id uuid default auth.uid()',
    table_name
  );

  execute format(
    'create index if not exists idx_%I_user_id on public.%I (user_id)',
    table_name,
    table_name
  );

  execute format(
    'create unique index if not exists idx_%I_user_id_id on public.%I (user_id, id)',
    table_name,
    table_name
  );

  execute format('alter table public.%I enable row level security', table_name);

  execute format('drop policy if exists "%I_select" on public.%I', table_name, table_name);
  execute format(
    'create policy "%I_select" on public.%I
      for select
      to authenticated
      using (user_id = auth.uid())',
    table_name,
    table_name
  );

  execute format('drop policy if exists "%I_insert" on public.%I', table_name, table_name);
  execute format(
    'create policy "%I_insert" on public.%I
      for insert
      to authenticated
      with check (user_id = auth.uid())',
    table_name,
    table_name
  );

  execute format('drop policy if exists "%I_update" on public.%I', table_name, table_name);
  execute format(
    'create policy "%I_update" on public.%I
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid())',
    table_name,
    table_name
  );

  execute format('drop policy if exists "%I_delete" on public.%I', table_name, table_name);
  execute format(
    'create policy "%I_delete" on public.%I
      for delete
      to authenticated
      using (user_id = auth.uid())',
    table_name,
    table_name
  );
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'app_settings',
    'clients',
    'suppliers',
    'products',
    'categories',
    'quotations',
    'purchases',
    'deliveries',
    'sales',
    'invoices',
    'payments',
    'cash_entries',
    'stock_movements',
    'alerts',
    'app_users',
    'audit_logs',
    'bank_accounts',
    'cheques',
    'bank_transfers',
    'manual_entries'
  ]
  loop
    perform public.create_payload_table(table_name);
  end loop;
end;
$$;
