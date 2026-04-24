import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { SHIFT_PATTERNS } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEBUG_FILE = path.join(process.cwd(), ".debug-last-ocr.json");

type OcrShift = {
  date: string;
  patternCode: string;
};

type OcrResponse = {
  shifts: OcrShift[];
  meta?: {
    targetName?: string;
    month?: string;
  };
};

const SYSTEM_PROMPT = `あなたは日本語の手書き勤務予定表を正確に読み取る専門家です。

## 表の構造（非常に重要）
1週間ごとに以下の4行が繰り返される：
- 1行目【日付】: その週の日付（例: 1, 2, 3, 4...）
- 2行目【早勤】: その日早番で勤務する人の名前
- 3行目【遅勤】: その日遅番系で勤務する人の名前
- 4行目【休み】: その日が休みの人の名前（公休・有休どちらも含む）

## シフトコード（アプリ内の5種類のみ）
### 勤務
- **E** = 早番 勤務 (10:00-16:30)
- **A** = 早番A 勤務 (10:00-17:30)  ※Aシフトという別パターンの勤務
- **F** = 中番 勤務 (15:30-23:30)   ※Fシフトという別パターンの勤務
- **B** = 遅番 勤務 (17:00-23:30)
### 有給
- **E休** = 早番時間の有給（旧Cが廃止され、E休に統合された）

## 画像上の表記と変換ルール（最重要・よく読むこと）

### 基本：名前に記号が付いていなければ、その行のデフォルトパターンで勤務
- 早勤行に **名前のみ**（プレフィックス無し） → **E**
- 遅勤行に **名前のみ**（プレフィックス無し） → **B**

### プレフィックス「A」「F」= そのシフト種別の勤務（有給ではない）
- **A国崎** → **A**（早番Aパターンでの勤務、10:00-17:30）
- **F国崎** → **F**（中番パターンでの勤務、15:30-23:30）
- A/F は「別パターンの勤務を示すマーカー」。有給ではない。

### プレフィックス「E」= 有給（唯一の有給プレフィックス）
- **E国崎** → **E休**（早番時間分の有給休暇）
- E だけが有給。他のアルファベットは勤務を意味する。
- 空の四角□のみのセル（旧C）があっても、今は E休 扱い。

## 判定ルール（厳守）
1. 対象者名が【休み】行にある日は、**絶対に抽出してはならない**（公休扱いなので記録不要）。
2. プレフィックスは直後の名前にのみ適用。例：「F岡野 国崎」の「F」は岡野のみに適用、国崎は記号なし→デフォルト。
3. 対象者名を **完全一致**で探すこと。別人の名前を誤抽出してはならない。
4. 日付は YYYY-MM-DD（ISO形式）。令和は R8=2026、R7=2025、R9=2027。
5. patternCode は必ず E / A / F / B / E休 のいずれか。曖昧な場合のみ "?" を返す。
6. 画像右下の月次集計表（氏名・早番(E)・中番(F)・遅番(B)・有休・勤務日数・休み）があれば、抽出結果と整合するよう検算する。例：集計表「国崎 早番(E)=12、有休=2」→ 抽出で E+A 合計12件、E休 2件 になるべき。

## 出力
JSON のみ（前後に説明文不要）:
{
  "shifts": [ { "date": "2026-04-03", "patternCode": "E" }, ... ],
  "meta": { "targetName": "...", "month": "2026-04" }
}`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY が未設定です。.env.local を確認してください。" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
      targetName?: string;
    };

    if (!body.imageBase64 || !body.mimeType) {
      return NextResponse.json(
        { error: "imageBase64 と mimeType は必須です" },
        { status: 400 }
      );
    }

    const targetName = body.targetName ?? "国崎";

    const ai = new GoogleGenAI({ apiKey });

    const contents = [
      {
        role: "user" as const,
        parts: [
          {
            inlineData: {
              mimeType: body.mimeType,
              data: body.imageBase64,
            },
          },
          { text: `対象者：「${targetName}」\n\n${SYSTEM_PROMPT}` },
        ],
      },
    ];

    const callModel = (model: string) =>
      ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

    const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];
    const retryDelaysMs = [0, 2000];
    let lastError: unknown = null;
    let text: string | undefined;

    outer: for (const model of models) {
      for (const delay of retryDelaysMs) {
        if (delay > 0) await new Promise((r) => setTimeout(r, delay));
        try {
          const result = await callModel(model);
          text = result.text;
          if (text) break outer;
        } catch (e) {
          lastError = e;
          const msg = e instanceof Error ? e.message : String(e);
          const is503 = /503|UNAVAILABLE|overloaded|high demand/i.test(msg);
          const isQuota = /429|RESOURCE_EXHAUSTED|quota/i.test(msg);
          if (isQuota) break;
          if (!is503) break;
        }
      }
    }

    if (!text) {
      const msg =
        lastError instanceof Error ? lastError.message : "応答なし";
      if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              "無料枠の回数制限に達しました。数分〜1日ほど待ってから再試行してください。",
          },
          { status: 429 }
        );
      }
      if (/503|UNAVAILABLE|overloaded|high demand/i.test(msg)) {
        return NextResponse.json(
          {
            error:
              "Geminiが混雑しています。1〜2分ほど待ってもう一度お試しください。",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: `Geminiから応答がありませんでした: ${msg}` },
        { status: 502 }
      );
    }

    let parsed: OcrResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Geminiの応答がJSONとして解析できませんでした", raw: text },
        { status: 502 }
      );
    }

    const validCodes = new Set(SHIFT_PATTERNS.map((p) => p.code));
    const shifts = (parsed.shifts ?? []).filter(
      (s): s is OcrShift =>
        typeof s.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(s.date) &&
        typeof s.patternCode === "string" &&
        (validCodes.has(s.patternCode) || s.patternCode === "?")
    );

    console.log("\n===== [OCR結果] =====");
    console.log("対象:", targetName);
    console.log("月:", parsed.meta?.month ?? "(不明)");
    console.log("件数:", shifts.length);
    shifts.forEach((s) =>
      console.log(`  ${s.date}  ${s.patternCode}`)
    );
    console.log("=====================\n");

    try {
      await fs.writeFile(
        DEBUG_FILE,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            targetName,
            meta: parsed.meta ?? {},
            rawText: text,
            shifts,
          },
          null,
          2
        ),
        "utf8"
      );
    } catch {
      // ignore debug write errors
    }

    return NextResponse.json({ shifts, meta: parsed.meta ?? {} });
  } catch (e) {
    const message = e instanceof Error ? e.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
