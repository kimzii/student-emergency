-- profiles: stores user profile data
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text check (role in ('student', 'parent')) not null,
  created_at timestamptz not null default now()
);

-- parent_students: links parents to students (many-to-many)
create table if not exists parent_students (
  parent_id uuid references profiles(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  primary key (parent_id, student_id)
);

-- emergency_events: created when student presses emergency
create table if not exists emergency_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  status text check (status in ('active', 'resolved')) not null default 'active',
  created_at timestamptz not null default now()
);

-- emergency_location_updates: for live tracking during an active emergency
create table if not exists emergency_location_updates (
  id uuid primary key default gen_random_uuid(),
  emergency_id uuid references emergency_events(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

-- push_tokens: stores parent device tokens for push notifications
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  token text not null,
  platform text check (platform in ('web', 'android', 'ios')) not null,
  created_at timestamptz not null default now()
);


-- =========================
-- Row Level Security (RLS)
-- =========================

-- profiles RLS
alter table profiles enable row level security;
create policy "Users can view all profiles" on profiles
  for select using (true);
create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- parent_students RLS
alter table parent_students enable row level security;
create policy "Parents can manage their links" on parent_students
  for all using (
    auth.uid() = parent_id or auth.uid() = student_id
  );

-- emergency_events RLS
alter table emergency_events enable row level security;
create policy "Students can insert their own emergencies" on emergency_events
  for insert with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'student')
    and auth.uid() = student_id
  );
create policy "Students can view their own emergencies" on emergency_events
  for select using (
    auth.uid() = student_id
  );
create policy "Parents can view emergencies for linked students" on emergency_events
  for select using (
    exists (
      select 1 from parent_students ps
      where ps.parent_id = auth.uid() and ps.student_id = student_id
    )
  );
create policy "Students can update their own emergencies" on emergency_events
  for update with check (
    auth.uid() = student_id
  );

-- emergency_location_updates RLS
alter table emergency_location_updates enable row level security;
create policy "Students can insert location updates for their emergencies" on emergency_location_updates
  for insert with check (
    exists (
      select 1 from emergency_events e
      where e.id = emergency_id and e.student_id = auth.uid()
    )
  );
create policy "Students can view their own location updates" on emergency_location_updates
  for select using (
    exists (
      select 1 from emergency_events e
      where e.id = emergency_id and e.student_id = auth.uid()
    )
  );
create policy "Parents can view location updates for linked students" on emergency_location_updates
  for select using (
    exists (
      select 1 from emergency_events e
      join parent_students ps on ps.student_id = e.student_id
      where e.id = emergency_id and ps.parent_id = auth.uid()
    )
  );

-- push_tokens RLS
alter table push_tokens enable row level security;
create policy "Users manage their own push tokens" on push_tokens
  for all using (
    auth.uid() = user_id
  );
