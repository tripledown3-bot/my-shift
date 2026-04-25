import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase未設定：NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local（Vercelでは Environment Variables）に設定してください。"
    );
  }
  _client = createClient(url, anonKey, { auth: { persistSession: false } });
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string, unknown>)[prop as string];
  },
});

export type DbShift = {
  id: string;
  user_id: "mom" | "son";
  date: string;
  pattern_code: string | null;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  created_at: string;
};

export type DbPlan = {
  id: string;
  user_id: "mom" | "son";
  date: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
};

export type DbMemo = {
  id: string;
  user_id: "mom" | "son";
  text: string;
  done: boolean;
  created_at: string;
};
