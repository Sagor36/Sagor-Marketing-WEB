-- SAGOR MARKETING TEAM — run in Supabase SQL Editor
create extension if not exists pgcrypto;
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade,email text,full_name text not null default 'Team Member',role text not null default 'member' check(role in ('admin','member')),created_at timestamptz not null default now());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,email,full_name,role) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','Team Member'),'member') on conflict(id) do nothing; return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create table if not exists public.team_members(id text primary key,code text not null,name text not null,role text not null,avatar_url text,created_at timestamptz not null default now());
insert into public.team_members(id,code,name,role,avatar_url) values ('member-01','Member 01','Member 01','Instagram & Content Strategist','/src/assets/images/member_avatar_01_1794839952270.jpg'),('member-02','Member 02','Member 02','Email & Lifecycle Specialist','/src/assets/images/member_avatar_02_1794839951915.jpg'),('member-03','Member 03','Member 03','Facebook Ads & Campaign Lead','/src/assets/images/member_avatar_03_1794839953403.jpg') on conflict(id) do nothing;
create table if not exists public.submissions(id text primary key,member_id text not null references public.team_members(id),member_name text not null,category text not null check(category in ('instagram','email','facebook','campaign')),quantity integer not null check(quantity>=0),description text not null default '',screenshots jsonb not null default '[]'::jsonb,submitted_at timestamptz not null default now(),created_by uuid not null references auth.users(id));
create index if not exists submissions_submitted_at_idx on public.submissions(submitted_at desc);
create table if not exists public.team_settings(id integer primary key check(id=1),team_name text not null default 'SAGOR MARKETING TEAM',tagline text not null default 'Grow Together • Achieve More',daily_activity_target integer not null default 50,weekly_activity_target integer not null default 250,compact_tables boolean not null default false);
insert into public.team_settings(id) values(1) on conflict(id) do nothing;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;
alter table public.profiles enable row level security; alter table public.team_members enable row level security; alter table public.submissions enable row level security; alter table public.team_settings enable row level security;
drop policy if exists "profile read self or admin" on public.profiles; create policy "profile read self or admin" on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
drop policy if exists "members readable by signed in users" on public.team_members; create policy "members readable by signed in users" on public.team_members for select to authenticated using(true);
drop policy if exists "members editable by admins" on public.team_members; create policy "members editable by admins" on public.team_members for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "submissions readable by signed in users" on public.submissions; create policy "submissions readable by signed in users" on public.submissions for select to authenticated using(true);
drop policy if exists "signed in users can submit work" on public.submissions; create policy "signed in users can submit work" on public.submissions for insert to authenticated with check(created_by=auth.uid());
drop policy if exists "admins can update submissions" on public.submissions; create policy "admins can update submissions" on public.submissions for update to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "admins can delete submissions" on public.submissions; create policy "admins can delete submissions" on public.submissions for delete to authenticated using(public.is_admin());
drop policy if exists "settings readable by signed in users" on public.team_settings; create policy "settings readable by signed in users" on public.team_settings for select to authenticated using(true);
drop policy if exists "settings managed by admins" on public.team_settings; create policy "settings managed by admins" on public.team_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('marketing-screenshots','marketing-screenshots',true,5242880,array['image/png','image/jpeg','image/webp','image/gif']) on conflict(id) do update set public=true,file_size_limit=5242880;
drop policy if exists "signed in users upload marketing screenshots" on storage.objects; create policy "signed in users upload marketing screenshots" on storage.objects for insert to authenticated with check(bucket_id='marketing-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "public can view marketing screenshots" on storage.objects; create policy "public can view marketing screenshots" on storage.objects for select to public using(bucket_id='marketing-screenshots');
drop policy if exists "users delete own marketing screenshots" on storage.objects; create policy "users delete own marketing screenshots" on storage.objects for delete to authenticated using(bucket_id='marketing-screenshots' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));

-- Account identity, private member submissions, and image verification upgrades
alter table public.submissions drop constraint if exists submissions_member_id_fkey;
alter table public.submissions add column if not exists member_email text not null default '';
update public.submissions s set member_email=coalesce(p.email,'') from public.profiles p where p.id=s.created_by and (s.member_email='' or s.member_email is null);
update public.submissions s set member_name=coalesce(nullif(p.full_name,''),'Team Member') from public.profiles p where p.id=s.created_by;
-- Members can only read their own submissions; admins can audit the complete team.
drop policy if exists "submissions readable by signed in users" on public.submissions;
drop policy if exists "members read own submissions and admins read all" on public.submissions;
create policy "members read own submissions and admins read all" on public.submissions for select to authenticated using(created_by=auth.uid() or public.is_admin());
