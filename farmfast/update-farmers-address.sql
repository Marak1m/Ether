-- Update farmers table to include full address
-- Run this in your Supabase SQL Editor

-- Add full_address column to farmers table
alter table public.farmers add column if not exists full_address text;

-- Add full_address to listings table as well
alter table public.listings add column if not exists full_address text;

-- Update chat_sessions to track address update flow
alter table public.chat_sessions add column if not exists temp_full_address text;
alter table public.chat_sessions add column if not exists temp_pincode text;
