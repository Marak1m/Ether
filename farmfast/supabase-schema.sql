-- FarmFast Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Listings table
create table public.listings (
  id uuid primary key default uuid_generate_v4(),
  farmer_phone text not null,
  crop_type text not null,
  quality_grade text not null check (quality_grade in ('A', 'B', 'C')),
  quantity_kg integer not null,
  location text default 'Maharashtra',
  price_range_min integer,
  price_range_max integer,
  shelf_life_days integer,
  image_url text,
  hindi_summary text,
  confidence_score integer,
  quality_factors jsonb,
  status text default 'active' check (status in ('active', 'sold', 'expired')),
  created_at timestamptz default now()
);

-- Offers table
create table public.offers (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade,
  buyer_name text not null,
  buyer_phone text,
  price_per_kg numeric(10,2) not null,
  total_amount numeric(10,2) not null,
  pickup_time text not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

-- Chat sessions (track WhatsApp conversation state)
create table public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  farmer_phone text unique not null,
  current_listing_id uuid references public.listings(id),
  conversation_state text default 'idle',
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.listings enable row level security;
alter table public.offers enable row level security;
alter table public.chat_sessions enable row level security;

-- Allow public read access for demo (adjust for production)
create policy "Allow public read on listings"
  on public.listings for select
  using (true);

create policy "Allow public insert on listings"
  on public.listings for insert
  with check (true);

create policy "Allow public update on listings"
  on public.listings for update
  using (true);

create policy "Allow public read on offers"
  on public.offers for select
  using (true);

create policy "Allow public insert on offers"
  on public.offers for insert
  with check (true);

create policy "Allow public on chat_sessions"
  on public.chat_sessions for all
  using (true);

-- Indexes for performance
create index listings_status_idx on public.listings(status);
create index listings_created_at_idx on public.listings(created_at desc);
create index offers_listing_id_idx on public.offers(listing_id);
create index chat_sessions_phone_idx on public.chat_sessions(farmer_phone);

-- Function to notify farmer of new offer (called by trigger)
create or replace function notify_new_offer()
returns trigger as $$
begin
  -- This will be picked up by Supabase realtime
  perform pg_notify('new_offer', json_build_object(
    'listing_id', NEW.listing_id,
    'offer_id', NEW.id,
    'buyer_name', NEW.buyer_name,
    'price_per_kg', NEW.price_per_kg
  )::text);
  return NEW;
end;
$$ language plpgsql;

-- Trigger to fire on new offer
create trigger on_new_offer
  after insert on public.offers
  for each row
  execute function notify_new_offer();
