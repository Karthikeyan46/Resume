-- ============================================================================
--  Karthikeyan.S — Academic Portfolio + Private Vault
--  Supabase schema. Run this ONCE in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================================
--  DESIGN NOTE (no redundancy):
--  There is exactly ONE row per item (certificate, FDP, journal, conference,
--  chapter, book, patent). The same row powers:
--     * the private vault (file download, notes, everything)
--     * the public portfolio page (only when is_public = true)
--  Files always live in a PRIVATE storage bucket. The public site shows
--  metadata only; the file itself is reachable only through a short-lived
--  signed URL created after you log in.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Main table
-- ---------------------------------------------------------------------------
create table if not exists public.records (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,

    -- what kind of item this is; drives which public section it appears in
    kind        text not null check (kind in (
                    -- research output  -> public "Research & Publications"
                    'journal',
                    'conference',
                    'chapter',       -- book chapter
                    'book',
                    'patent',
                    -- academic activity -> public "Certifications & Faculty Development"
                    'fdp',           -- faculty development programme
                    'workshop',      -- workshop / seminar / webinar attended
                    'course',        -- NPTEL, Coursera, MOOC, training with a grade
                    'certificate',   -- generic certificate that fits none of the above
                    -- standing        -> public "Professional Memberships"
                    'membership',
                    -- service         -> public "Roles & Responsibilities"
                    'role',
                    -- private only (see the guard below)
                    'education',     -- degrees, marksheets, transcripts
                    'employment',    -- appointment / experience / relieving / increment
                    'teaching',      -- course files, question papers, lab manuals
                    'misc',          -- random certificates that fit nowhere
                    'other'
                )),

    title       text not null,
    venue       text,               -- issuing body / journal / publisher / conference
    meta        text,               -- "Vol. 71(3)", "Elite + Silver 79%", page numbers
    year        int,
    issued_on   date,
    link        text,               -- DOI / IEEE Xplore / verification URL
    icon        text default '📄',  -- emoji shown on the public certificate card
    image_url   text,               -- logo for membership cards, e.g. assets/img/iste-logo.jpg

    -- private file (nullable: a record can exist before you find the PDF)
    file_path   text,               -- storage key, always "<user_id>/<uuid>-<name>"
    file_name   text,
    file_size   bigint,
    mime_type   text,

    notes       text,               -- PRIVATE. never exposed publicly.
    tags        text[] default '{}',

    is_public   boolean not null default false,
    sort_order  int not null default 0,

    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),

    -- Safety net: personal and employment records can NEVER be flagged public,
    -- however hard you click. The database refuses the update.
    constraint publishable_kinds_only check (
        is_public = false or kind in (
            'journal', 'conference', 'chapter', 'book', 'patent',
            'fdp', 'workshop', 'course', 'certificate',
            'membership', 'role'
        )
    )
);

create index if not exists records_user_idx   on public.records (user_id);
create index if not exists records_public_idx on public.records (is_public, kind, sort_order);

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end $$;

drop trigger if exists records_touch on public.records;
create trigger records_touch before update on public.records
    for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Row Level Security — you can only ever see and touch your own rows
-- ---------------------------------------------------------------------------
alter table public.records enable row level security;

drop policy if exists "owner reads own records"    on public.records;
drop policy if exists "owner inserts own records"  on public.records;
drop policy if exists "owner updates own records"  on public.records;
drop policy if exists "owner deletes own records"  on public.records;

create policy "owner reads own records"   on public.records
    for select to authenticated using (auth.uid() = user_id);
create policy "owner inserts own records" on public.records
    for insert to authenticated with check (auth.uid() = user_id);
create policy "owner updates own records" on public.records
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner deletes own records" on public.records
    for delete to authenticated using (auth.uid() = user_id);

-- anonymous visitors get NOTHING from the base table
revoke all on public.records from anon;

-- ---------------------------------------------------------------------------
-- 3. Public view — the only thing the portfolio page can read
--    Deliberately omits notes, tags, file_path, user_id.
-- ---------------------------------------------------------------------------
drop view if exists public.public_records;
create view public.public_records as
    select id, kind, title, venue, meta, year, issued_on, link, icon, image_url, sort_order
    from public.records
    where is_public = true;

alter view public.public_records set (security_barrier = true);
grant select on public.public_records to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Private storage bucket for the actual PDFs / images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do update set public = false;

drop policy if exists "vault owner read"   on storage.objects;
drop policy if exists "vault owner write"  on storage.objects;
drop policy if exists "vault owner update" on storage.objects;
drop policy if exists "vault owner delete" on storage.objects;

-- every file must sit under a folder named after your user id
create policy "vault owner read" on storage.objects
    for select to authenticated
    using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vault owner write" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vault owner update" on storage.objects
    for update to authenticated
    using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vault owner delete" on storage.objects
    for delete to authenticated
    using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Done. Next: create your account, then run db/seed.sql to import the
-- content that is currently hard-coded in index.html.
-- ---------------------------------------------------------------------------
