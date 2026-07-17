-- 请在 Supabase Dashboard → SQL Editor 中执行本脚本
-- 执行成功后，前端收藏功能即可写入 public.favorites

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  concept_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, concept_id)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);

alter table public.favorites enable row level security;

drop policy if exists "用户可读自己的收藏" on public.favorites;
drop policy if exists "用户可新增自己的收藏" on public.favorites;
drop policy if exists "用户可删除自己的收藏" on public.favorites;
drop policy if exists "用户可更新自己的收藏" on public.favorites;

create policy "用户可读自己的收藏"
  on public.favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "用户可新增自己的收藏"
  on public.favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "用户可删除自己的收藏"
  on public.favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "用户可更新自己的收藏"
  on public.favorites
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 让 API 能访问该表
grant select, insert, update, delete on public.favorites to authenticated;
grant select on public.favorites to anon;
