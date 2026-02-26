-- Add farmers table to track farmer profiles
-- Run this in your Supabase SQL Editor

create table if not exists public.farmers (
  id uuid primary key default uuid_generate_v4(),
  phone text unique not null,
  name text not null,
  location text,
  pincode text,
  latitude numeric,
  longitude numeric,
  is_registered boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.farmers enable row level security;

-- Allow public access for demo
create policy "Allow public on farmers"
  on public.farmers for all
  using (true);

-- Index for performance
create index farmers_phone_idx on public.farmers(phone);

-- Add farmer_id to listings table (optional, for future use)
alter table public.listings add column if not exists farmer_id uuid references public.farmers(id);

-- Update chat_sessions to track registration state
alter table public.chat_sessions add column if not exists farmer_name text;
alter table public.chat_sessions add column if not exists farmer_location text;

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger update_farmers_updated_at
  before update on public.farmers
  for each row
  execute function update_updated_at_column();
