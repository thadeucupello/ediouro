create table if not exists public.catalog_imports (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_date date,
  source_commit text,
  works_count integer not null default 0,
  editions_count integer not null default 0,
  covers_count integer not null default 0,
  status text not null default 'ready' check (status in ('processing', 'ready', 'failed', 'replaced')),
  notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_works (
  id text primary key,
  slug text not null unique,
  title text not null,
  subtitle text,
  short_description text,
  description jsonb not null default '[]'::jsonb,
  imprint text not null,
  collections text[] not null default '{}',
  categories text[] not null default '{}',
  subjects text[] not null default '{}',
  featured text[] not null default '{}',
  popularity integer not null default 0,
  seo_title text,
  seo_description text,
  series_slug text,
  series_order numeric,
  credits jsonb not null default '[]'::jsonb,
  source jsonb not null default '{}'::jsonb,
  manual jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  import_id uuid references public.catalog_imports(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_editions (
  id text primary key,
  work_slug text not null references public.catalog_works(slug) on update cascade on delete cascade,
  label text,
  format text,
  publication_date date,
  language text,
  status text,
  binding text,
  isbn text,
  ean text not null,
  page_count integer,
  dimensions text,
  cover_source_url text,
  cover_storage_path text,
  cover_url text,
  gallery jsonb not null default '[]'::jsonb,
  price numeric(12,2),
  currency text not null default 'BRL',
  credits jsonb not null default '[]'::jsonb,
  display_priority integer not null default 0,
  retailer_links jsonb not null default '[]'::jsonb,
  availability_note text,
  source jsonb not null default '{}'::jsonb,
  manual jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  import_id uuid references public.catalog_imports(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists catalog_editions_isbn_uq
  on public.catalog_editions(isbn) where isbn is not null and isbn <> '';
create unique index if not exists catalog_editions_ean_uq
  on public.catalog_editions(ean);
create index if not exists catalog_editions_work_slug_idx
  on public.catalog_editions(work_slug);
create index if not exists catalog_works_imprint_idx
  on public.catalog_works(imprint);
create index if not exists catalog_works_import_id_idx
  on public.catalog_works(import_id);
create index if not exists catalog_editions_import_id_idx
  on public.catalog_editions(import_id);

create table if not exists public.catalog_contributors (
  slug text primary key,
  name text not null,
  roles text[] not null default '{}',
  short_bio text,
  bio jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  import_id uuid references public.catalog_imports(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_series (
  slug text primary key,
  name text not null,
  description text,
  imprint text,
  main_contributor text,
  work_slugs text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  import_id uuid references public.catalog_imports(id),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_contributors_import_id_idx
  on public.catalog_contributors(import_id);
create index if not exists catalog_series_import_id_idx
  on public.catalog_series(import_id);

alter table public.catalog_imports enable row level security;
alter table public.catalog_works enable row level security;
alter table public.catalog_editions enable row level security;
alter table public.catalog_contributors enable row level security;
alter table public.catalog_series enable row level security;

grant select on public.catalog_imports, public.catalog_works, public.catalog_editions,
  public.catalog_contributors, public.catalog_series to anon, authenticated;

drop policy if exists "public catalog imports are readable" on public.catalog_imports;
create policy "public catalog imports are readable" on public.catalog_imports
  for select to anon, authenticated using (status = 'ready');

drop policy if exists "public catalog works are readable" on public.catalog_works;
create policy "public catalog works are readable" on public.catalog_works
  for select to anon, authenticated using (active = true);

drop policy if exists "public catalog editions are readable" on public.catalog_editions;
create policy "public catalog editions are readable" on public.catalog_editions
  for select to anon, authenticated using (active = true);

drop policy if exists "public catalog contributors are readable" on public.catalog_contributors;
create policy "public catalog contributors are readable" on public.catalog_contributors
  for select to anon, authenticated using (true);

drop policy if exists "public catalog series are readable" on public.catalog_series;
create policy "public catalog series are readable" on public.catalog_series
  for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-covers',
  'catalog-covers',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
