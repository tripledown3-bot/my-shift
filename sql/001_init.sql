-- my-shift 初期スキーマ
-- Supabase SQL Editor で実行

-- ==========================================
-- テーブル作成
-- ==========================================

-- シフト（2人で共有表示）
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null check (user_id in ('mom', 'son')),
  date date not null,
  pattern_code text,
  start_time time,
  end_time time,
  note text,
  created_at timestamptz default now()
);
create index if not exists shifts_date_idx on shifts(date);

-- 予定（各自のみ）
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id text not null check (user_id in ('mom', 'son')),
  date date not null,
  title text not null,
  start_time time,
  end_time time,
  created_at timestamptz default now()
);
create index if not exists plans_user_date_idx on plans(user_id, date);

-- メモ（各自のみ）
create table if not exists memos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null check (user_id in ('mom', 'son')),
  text text not null,
  done boolean default false,
  created_at timestamptz default now()
);
create index if not exists memos_user_idx on memos(user_id);

-- ==========================================
-- RLS（家族専用・認証なしなので anon に全権付与）
-- ==========================================

alter table shifts enable row level security;
alter table plans enable row level security;
alter table memos enable row level security;

-- 既存のポリシーを削除（冪等性のため）
drop policy if exists "shifts_all" on shifts;
drop policy if exists "plans_all" on plans;
drop policy if exists "memos_all" on memos;

-- anon に読み書き許可（2人しか使わない想定）
create policy "shifts_all" on shifts for all to anon using (true) with check (true);
create policy "plans_all" on plans for all to anon using (true) with check (true);
create policy "memos_all" on memos for all to anon using (true) with check (true);
