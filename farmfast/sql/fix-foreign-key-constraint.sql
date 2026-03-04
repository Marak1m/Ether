-- Fix foreign key constraint to allow cascade delete
-- Run this in your Supabase SQL Editor

-- First, drop the existing foreign key constraint if it exists
alter table public.listings 
drop constraint if exists listings_farmer_id_fkey;

-- Add the foreign key constraint back with CASCADE delete
-- This means when a farmer is deleted, their listings are also deleted
alter table public.listings 
add constraint listings_farmer_id_fkey 
foreign key (farmer_id) 
references public.farmers(id) 
on delete cascade;

-- Alternatively, if you want to keep listings when farmer is deleted,
-- use SET NULL instead (uncomment the lines below and comment the above):

-- alter table public.listings 
-- add constraint listings_farmer_id_fkey 
-- foreign key (farmer_id) 
-- references public.farmers(id) 
-- on delete set null;
