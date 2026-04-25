"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/components/UserContext";
import {
  WEEKDAY_JA,
  daysInMonthGrid,
  monthLabel,
  parseYmd,
  ymd,
} from "@/lib/date";
import { addShifts } from "@/lib/db";
import { findPattern, getPatternsForUser } from "@/lib/types";

type Draft = {
  date: string;
  patternCode: string;
};

const DUMMY_DRAFTS: Draft[] = [
  { date: "2026-04-03", patternCode: "E" },
  { date: "2026-04-04", patternCode: "E" },
  { date: "2026-04-08", patternCode: "E" },
  { date: "2026-04-09", patternCode: "E" },
  { date: "2026-04-12", patternCode: "E" },
  { date: "2026-04-13", patternCode: "A" },
  { date: "2026-04-17", patternCode: "E" },
  { date: "2026-04-21", patternCode: "E" },
  { date: "2026-04-22", patternCode: "E" },
  { date: "2026-04-25", patternCode: "E" },
  { date: "2026-04-26", patternCode: "E" },
  { date: "2026-04-28", patternCode: "E休" },
  { date: "2026-04-29", patternCode: "E休" },
  { date: "2026-04-30", patternCode: "E" },
];

export default function PhotoRegisterPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageData, setImageData] = useState<{
    dataUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [targetName, setTargetName] = useState("国崎");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [cursor, setCursor] = useState<Date>(new Date());
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const draftsByDate = useMemo(() => {
    const map = new Map<string, Draft>();
    drafts.forEach((d) => map.set(d.date, d));
    return map;
  }, [drafts]);

  const pickImage = () => inputRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      const base64 = dataUrl.slice(comma + 1);
      setImageData({ dataUrl, base64, mimeType: file.type || "image/jpeg" });
      setDrafts([]);
      setErrorMsg(null);
      setInfoMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const runOcr = async () => {
    if (!imageData) return;
    setAnalyzing(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageData.base64,
          mimeType: imageData.mimeType,
          targetName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const rawError =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ?? "読みとりに失敗しました";
        if (res.status === 500 && rawError.includes("GEMINI_API_KEY")) {
          setDrafts(DUMMY_DRAFTS);
          jumpToFirstDraft(DUMMY_DRAFTS);
          setInfoMsg(
            "APIキー未設定のためダミー結果を表示しています。.env.local で設定してください。"
          );
          return;
        }
        if (res.status === 503) {
          throw new Error("Geminiが混雑しています。1〜2分待って再試行してください。");
        }
        if (res.status === 429) {
          throw new Error("無料枠の回数制限に達しました。数分〜1日待ってから再試行してください。");
        }
        throw new Error(rawError);
      }
      const shifts = (data.shifts ?? []) as Draft[];
      if (shifts.length === 0) {
        setErrorMsg("シフトが抽出できませんでした。写真を撮り直してください。");
        return;
      }
      setDrafts(shifts);
      jumpToFirstDraft(shifts);
      setInfoMsg(`${shifts.length}件のシフトを抽出しました。紙と見比べて確認してください。`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "不明なエラー");
    } finally {
      setAnalyzing(false);
    }
  };

  const jumpToFirstDraft = (items: Draft[]) => {
    if (items.length === 0) return;
    const first = parseYmd(items[0].date);
    setCursor(new Date(first.getFullYear(), first.getMonth(), 1));
  };

  const setCodeForDate = (date: string, code: string | null) => {
    setDrafts((prev) => {
      const filtered = prev.filter((d) => d.date !== date);
      if (code === null) return filtered;
      return [...filtered, { date, patternCode: code }].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });
  };

  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (drafts.length === 0) {
      alert("登録するシフトがありません");
      return;
    }
    const unresolved = drafts.some((d) => d.patternCode === "?");
    if (unresolved) {
      alert("「?」のままの日があります。種別を選んでから登録してください。");
      return;
    }
    setSaving(true);
    try {
      await addShifts(
        drafts.map((d) => {
          const p = findPattern(d.patternCode);
          return {
            userId: user.id,
            date: d.date,
            patternCode: d.patternCode,
            startTime: p?.isLeave ? undefined : p?.startTime,
            endTime: p?.isLeave ? undefined : p?.endTime,
          };
        })
      );
      alert(`${drafts.length}件のシフトを登録しました`);
      router.push("/calendar");
    } catch (e) {
      alert(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const cells = daysInMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const editingDraft = editingDate ? draftsByDate.get(editingDate) : undefined;

  const chipStyle = (code: string): { bg: string; fg: string } => {
    const p = findPattern(code);
    if (!p) return { bg: "#ef4444", fg: "#ffffff" };
    if (p.isLeave) return { bg: "#fbbf24", fg: "#78350f" };
    if (code === "A") return { bg: "#16a34a", fg: "#ffffff" };
    if (code === "F") return { bg: "#0891b2", fg: "#ffffff" };
    if (code === "B") return { bg: "#7c3aed", fg: "#ffffff" };
    return { bg: "#2d5a3d", fg: "#ffffff" };
  };

  return (
    <>
      <AppHeader title="写真から登録" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-5 py-5 space-y-5">
        <section className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-lg mb-3">① 読み取る人の名前</h3>
          <input
            type="text"
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            className="w-full rounded-lg border border-border px-3 bg-white"
            placeholder="例：国崎"
          />
        </section>

        <section className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-lg mb-3">② 紙のシフトを撮影</h3>
          {imageData ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageData.dataUrl}
              alt="シフト表"
              className="rounded-xl border border-border w-full max-h-72 object-contain bg-background"
            />
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border h-40 flex items-center justify-center text-muted text-base">
              まだ写真はありません
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFile}
            className="hidden"
          />
          <button
            onClick={pickImage}
            className="mt-4 w-full rounded-2xl bg-primary text-white text-xl font-bold py-4"
          >
            📷 写真を撮る／選ぶ
          </button>
        </section>

        {imageData && (
          <section className="bg-white rounded-2xl border border-border p-5">
            <h3 className="font-bold text-lg mb-3">③ AIで読みとる</h3>
            <button
              onClick={runOcr}
              disabled={analyzing}
              className="w-full rounded-2xl bg-accent text-white text-xl font-bold py-4 disabled:opacity-60"
            >
              {analyzing ? "読みとり中…（15秒ほど）" : "🔍 読みとり開始"}
            </button>
            {errorMsg && (
              <p className="mt-3 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-base">
                ⚠ {errorMsg}
              </p>
            )}
            {infoMsg && (
              <p className="mt-3 text-primary bg-primary/10 border border-primary/20 rounded-lg p-3 text-base">
                ✓ {infoMsg}
              </p>
            )}
          </section>
        )}

        {drafts.length > 0 && (
          <section className="bg-white rounded-2xl border border-border p-4">
            <h3 className="font-bold text-lg mb-1 px-1">
              ④ 紙と見くらべて確認
            </h3>
            <p className="text-base text-muted mb-3 px-1">
              日にちをタップして変更できます
            </p>

            <div className="flex items-center justify-between mb-2 px-1">
              <button
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
                className="px-3 py-1.5 rounded-full bg-background border border-border text-lg"
                aria-label="前の月"
              >
                ←
              </button>
              <span className="text-xl font-bold">{monthLabel(cursor)}</span>
              <button
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
                className="px-3 py-1.5 rounded-full bg-background border border-border text-lg"
                aria-label="次の月"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_JA.map((w, i) => (
                <div
                  key={w}
                  className={`text-center py-1 text-sm font-bold ${
                    i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : ""
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                const key = ymd(d);
                const inMonth = d.getMonth() === cursor.getMonth();
                const draft = draftsByDate.get(key);
                const weekday = d.getDay();
                return (
                  <button
                    key={i}
                    onClick={() => setEditingDate(key)}
                    style={{ minHeight: 0 }}
                    className={`aspect-square min-w-0 rounded-xl text-left p-1 flex flex-col border-2 transition ${
                      draft
                        ? "bg-white border-primary"
                        : inMonth
                        ? "bg-white border-border"
                        : "bg-background/40 border-transparent"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold leading-none ${
                        weekday === 0
                          ? "text-red-600"
                          : weekday === 6
                          ? "text-blue-600"
                          : ""
                      } ${!inMonth ? "opacity-40" : ""}`}
                    >
                      {d.getDate()}
                    </span>
                    {draft && (
                      <div
                        className="mt-auto rounded-md text-center py-0.5 font-bold text-sm"
                        style={{
                          backgroundColor: chipStyle(draft.patternCode).bg,
                          color: chipStyle(draft.patternCode).fg,
                        }}
                      >
                        {draft.patternCode}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="font-bold">色の意味：</span>
              <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: "#2d5a3d" }}>
                E 早番
              </span>
              <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: "#16a34a" }}>
                A 早番A
              </span>
              <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: "#0891b2" }}>
                F 中番
              </span>
              <span className="px-2 py-0.5 rounded text-white" style={{ backgroundColor: "#7c3aed" }}>
                B 遅番
              </span>
              <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "#fbbf24", color: "#78350f" }}>
                E休 有給
              </span>
            </div>
          </section>
        )}

        <div className="h-28" aria-hidden />
      </main>

      {drafts.length > 0 && (
        <div className="fixed bottom-[68px] inset-x-0 z-10 px-3">
          <div className="max-w-md mx-auto">
            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-2xl bg-primary text-white text-xl font-bold py-4 shadow-lg disabled:opacity-60"
            >
              {saving ? "登録中…" : `✓ ${drafts.length}件をカレンダーに登録`}
            </button>
          </div>
        </div>
      )}

      {editingDate && (
        <EditSheet
          date={editingDate}
          currentCode={editingDraft?.patternCode}
          userId={user.id}
          onPick={(code) => {
            setCodeForDate(editingDate, code);
            setEditingDate(null);
          }}
          onDelete={() => {
            setCodeForDate(editingDate, null);
            setEditingDate(null);
          }}
          onClose={() => setEditingDate(null)}
        />
      )}
    </>
  );
}

function EditSheet({
  date,
  currentCode,
  userId,
  onPick,
  onDelete,
  onClose,
}: {
  date: string;
  currentCode?: string;
  userId: "mom" | "son";
  onPick: (code: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const display = date.replaceAll("-", "/");
  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-5 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-3" />
        <h3 className="text-xl font-bold text-center mb-4">
          {display}
        </h3>

        <div className="space-y-2">
          {getPatternsForUser(userId).map((sp) => {
            const active = currentCode === sp.code;
            return (
              <button
                key={sp.code}
                onClick={() => onPick(sp.code)}
                className={`w-full rounded-xl p-3 border-2 flex items-center gap-3 text-left ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-border"
                }`}
              >
                <span className="inline-flex items-center justify-center min-w-14 h-10 px-3 rounded-lg font-bold text-lg bg-background text-foreground">
                  {sp.code}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-lg">{sp.label}</div>
                  <div className="text-sm opacity-80">
                    {sp.startTime && sp.endTime
                      ? `${sp.startTime}〜${sp.endTime}${sp.isLeave ? "（有給）" : ""}`
                      : sp.isLeave
                      ? "有給"
                      : ""}
                  </div>
                </div>
                {active && <span className="text-2xl">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {currentCode && (
            <button
              onClick={onDelete}
              className="rounded-xl py-3 border-2 border-red-300 text-red-700 text-base font-bold"
            >
              この日のシフトを消す
            </button>
          )}
          <button
            onClick={onClose}
            className={`rounded-xl py-3 border-2 border-border text-base font-bold ${
              currentCode ? "" : "col-span-2"
            }`}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
