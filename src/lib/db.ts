"use client";

import { supabase, type DbMemo, type DbPlan, type DbShift } from "./supabase";
import type { Memo, Plan, Shift, UserId } from "./types";

// ---------------------------------------------
// 変換ユーティリティ（DB ↔ App）
// ---------------------------------------------

function toShift(row: DbShift): Shift {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    patternCode: row.pattern_code ?? undefined,
    startTime: row.start_time?.slice(0, 5) ?? undefined,
    endTime: row.end_time?.slice(0, 5) ?? undefined,
    note: row.note ?? undefined,
  };
}

function toPlan(row: DbPlan): Plan {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    title: row.title,
    startTime: row.start_time?.slice(0, 5) ?? undefined,
    endTime: row.end_time?.slice(0, 5) ?? undefined,
  };
}

function toMemo(row: DbMemo): Memo {
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    done: row.done,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------
// シフト（2人で共有）
// ---------------------------------------------

export async function fetchShifts(): Promise<Shift[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => toShift(row as DbShift));
}

export async function addShifts(
  items: Array<Omit<Shift, "id">>
): Promise<Shift[]> {
  if (items.length === 0) return [];
  const payload = items.map((s) => ({
    user_id: s.userId,
    date: s.date,
    pattern_code: s.patternCode ?? null,
    start_time: s.startTime ?? null,
    end_time: s.endTime ?? null,
    note: s.note ?? null,
  }));
  const { data, error } = await supabase
    .from("shifts")
    .insert(payload)
    .select();
  if (error) throw error;
  return (data ?? []).map((row) => toShift(row as DbShift));
}

export async function updateShift(
  id: string,
  patch: Partial<Omit<Shift, "id" | "userId">>
): Promise<void> {
  const payload: Record<string, string | null> = {};
  if ("patternCode" in patch) payload.pattern_code = patch.patternCode ?? null;
  if ("startTime" in patch) payload.start_time = patch.startTime ?? null;
  if ("endTime" in patch) payload.end_time = patch.endTime ?? null;
  if ("note" in patch) payload.note = patch.note ?? null;
  if ("date" in patch && patch.date) payload.date = patch.date;
  const { error } = await supabase.from("shifts").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deleteShift(id: string): Promise<void> {
  const { error } = await supabase.from("shifts").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------
// 予定（各自のみ）
// ---------------------------------------------

export async function fetchPlans(userId: UserId): Promise<Plan[]> {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => toPlan(row as DbPlan));
}

export async function addPlan(plan: Omit<Plan, "id">): Promise<Plan> {
  const payload = {
    user_id: plan.userId,
    date: plan.date,
    title: plan.title,
    start_time: plan.startTime ?? null,
    end_time: plan.endTime ?? null,
  };
  const { data, error } = await supabase
    .from("plans")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return toPlan(data as DbPlan);
}

export async function updatePlan(
  id: string,
  patch: Partial<Omit<Plan, "id" | "userId">>
): Promise<void> {
  const payload: Record<string, string | null> = {};
  if ("title" in patch && patch.title !== undefined) payload.title = patch.title;
  if ("startTime" in patch) payload.start_time = patch.startTime ?? null;
  if ("endTime" in patch) payload.end_time = patch.endTime ?? null;
  if ("date" in patch && patch.date) payload.date = patch.date;
  const { error } = await supabase.from("plans").update(payload).eq("id", id);
  if (error) throw error;
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------
// メモ（各自のみ）
// ---------------------------------------------

export async function fetchMemos(userId: UserId): Promise<Memo[]> {
  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => toMemo(row as DbMemo));
}

export async function addMemo(
  memo: Omit<Memo, "id" | "createdAt">
): Promise<Memo> {
  const payload = {
    user_id: memo.userId,
    text: memo.text,
    done: memo.done,
  };
  const { data, error } = await supabase
    .from("memos")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return toMemo(data as DbMemo);
}

export async function updateMemo(
  id: string,
  patch: Partial<Pick<Memo, "text" | "done">>
): Promise<void> {
  const { error } = await supabase.from("memos").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteMemo(id: string): Promise<void> {
  const { error } = await supabase.from("memos").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteDoneMemos(userId: UserId): Promise<void> {
  const { error } = await supabase
    .from("memos")
    .delete()
    .eq("user_id", userId)
    .eq("done", true);
  if (error) throw error;
}
