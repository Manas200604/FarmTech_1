-- Supabase Schema + RLS + Policies for FarmTech

-- USERS TABLE
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  name text,
  email text unique,
  phone text,
  role text check (role in ('farmer', 'admin')) default 'farmer',
  farm_location text,
  crop_type text,
  created_at timestamptz default now()
);

-- UPLOADS TABLE
create table if not exists uploads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users (id) on delete cascade,
  image_url text,
  description text,
  crop_type text,
  status text default 'pending',
  admin_feedback text,
  created_at timestamptz default now()
);

-- SCHEMES TABLE
create table if not exists schemes (
  id uuid primary key default uuid_generate_v4(),
  title text,
  description text,
  eligibility text,
  documents jsonb,
  government_link text,
  created_by uuid references users (id),
  created_at timestamptz default now()
);

-- CONTACTS TABLE
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  name text,
  specialization text,
  crop_type text,
  contact_info text,
  region text
);

-- PESTICIDES TABLE
create table if not exists pesticides (
  id uuid primary key default uuid_generate_v4(),
  name text,
  crop_type text,
  description text,
  recommended_usage text,
  price_range text
);

-- STATS TABLE
create table if not exists stats (
  id uuid primary key default uuid_generate_v4(),
  total_users int,
  total_uploads int,
  total_schemes int,
  last_updated timestamptz default now()
);

-- Enable Row Level Security
alter table users enable row level security;
alter table uploads enable row level security;
alter table schemes enable row level security;
alter table contacts enable row level security;
alter table pesticides enable row level security;

-- RLS + POLICIES

-- USERS POLICIES
create policy "Users can view self" on users for select using (auth.uid() = id);
create policy "Users can update self" on users for update using (auth.uid() = id);
create policy "Admins manage all users" on users for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- UPLOADS POLICIES
create policy "Insert own uploads" on uploads for insert with check (auth.uid() = user_id);
create policy "View own uploads" on uploads for select using (
  auth.uid() = user_id or exists (select 1 from users where id = auth.uid() and role = 'admin')
);
create policy "Admins can update uploads" on uploads for update using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

-- SCHEMES, CONTACTS, PESTICIDES POLICIES
create policy "Read for all" on schemes for select using (true);
create policy "Admin write access" on schemes for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "Read for all" on contacts for select using (true);
create policy "Admin write access" on contacts for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);

create policy "Read for all" on pesticides for select using (true);
create policy "Admin write access" on pesticides for all using (
  exists (select 1 from users where id = auth.uid() and role = 'admin')
);
