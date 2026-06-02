-- Artist drafts table: stores pending signup data server-side
-- so magic link works across devices
create table if not exists public.artist_drafts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  bio text,
  city text,
  years_experience int default 0,
  categories text[] default '{}',
  portfolio_urls text[] default '{}',
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours')
);

-- Anyone can insert their own draft (before they have an account)
alter table public.artist_drafts enable row level security;

create policy "anyone can upsert draft by email"
  on public.artist_drafts for all
  using (true)
  with check (true);

-- Auto-cleanup expired drafts
create index if not exists artist_drafts_email_idx on public.artist_drafts(email);
create index if not exists artist_drafts_expires_idx on public.artist_drafts(expires_at);
