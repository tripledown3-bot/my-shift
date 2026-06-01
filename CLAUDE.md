@AGENTS.md

# my-shift

物流倉庫スタッフのシフト管理 Web アプリ（シフト管理アプリ の別ディレクトリ版）

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router) ← AGENTS.md の警告を必ず読むこと
- **言語**: TypeScript
- **スタイル**: Tailwind CSS
- **DB / 認証**: Supabase (RLS 有効)
- **認証方式**: マジックリンク（パスワード不要、メール認証のみ）
- **デプロイ先**: Vercel（予定）

## 業務仕様

- **2拠点対応**: 本部物流倉庫 / EC物流倉庫
- **希望休申請**: スタッフが休みたい日を申請
- **希望休の他人非表示**: 申請中は本人と管理者のみ閲覧可（RLS で制御）
- **週20時間制約チェック**: 上限がある人は自動警告
- **アプリ内通知**: シフト確定・希望休承認

## 開発コマンド

```bash
npm run dev   # http://localhost:3000
```

## 環境変数（.env.local）

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
```

## Next.js 15 の注意点

App Router 使用。`node_modules/next/dist/docs/` を参照して最新 API を確認すること。
