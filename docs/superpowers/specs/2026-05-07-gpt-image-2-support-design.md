# gpt-image-2 サポート設計

- 作成日: 2026-05-07
- 対象リポジトリ: `naporin0624/gpt-image-1-mcp`
- ステータス: ドラフト（ユーザーレビュー待ち）

## 背景

OpenAI が `gpt-image-2`（および dated snapshot `gpt-image-2-2026-04-21`）をリリースした。本 MCP サーバーは現在 `gpt-image-1` のみをハードコーディングして使用しており、新モデルの能力（任意サイズ、`auto` size、複数画像入力によるコンポジション、`background: opaque/automatic`）を活用できない。

本設計では、`gpt-image-1` と `gpt-image-2` の両モデルを **Zod の `z.discriminatedUnion`** によって安全に切り替えられる API に拡張し、新モデルの新機能を段階的に公開する。

## 目的

1. `model` パラメータで `gpt-image-1` と `gpt-image-2` を選択可能にする（デフォルト: `gpt-image-2`）
2. 各モデルの能力差を Zod schema 上で型レベルに表現し、誤った組み合わせ（例: `gpt-image-1` で `square_2k`）を弾く
3. gpt-image-2 の新機能（2K プリセット / `auto` size / 複数画像 edit）を MCP ツールから利用可能にする
4. パッケージ名を `@napolab/gpt-image-mcp` に rename し、model-agnostic な命名にする
5. MCP の `inputSchema` を Zod schema から `zod-to-json-schema` で自動生成し、二重管理を排除する

## Non-goals

- 旧パッケージ `@napolab/gpt-image-1-mcp` の deprecated 化（npm 上のメタデータ操作は別アクション）
- `gpt-image-2-2026-04-21` などの dated snapshot を model 値として exposing すること（将来別チケット）
- `analyze-image` の復活、`generateMask` の本実装
- `size: "auto"` 時のレスポンス画像から実寸取得するための `sharp` 等の重い依存追加（最初は metadata 0 + warning）

## ユーザーストーリー

- LLM クライアントは引数 `model` を省略するだけで gpt-image-2 を利用できる（後方互換）
- 既存の連携で `model: "gpt-image-1"` と明示すれば従来通り動く
- `model: "gpt-image-2"` の利用者は `aspect_ratio: "square_2k" | "landscape_2k" | "portrait_2k" | "auto"` を選べる
- `edit-image` を `model: "gpt-image-2"` で呼ぶ際、`source_image` に画像配列を渡してコンポジション生成できる

## アーキテクチャ概要

### 採用方針: ベース schema + per-model 拡張 + `z.discriminatedUnion`

各モデル固有のフィールド（`aspect_ratio`, `quality`, `background`, `source_image` 形状）を `model: z.literal(...)` で識別する分岐に分離する。共通フィールド（`prompt`, `output_format`, `save_to_file`, naming 系など）は `GenerateBase` / `EditBase` に集約し、`.extend()` で各分岐に重ねる。

### ディレクトリ構成

```
src/
├── index.ts              # MCP entry: discriminated union を parse → model 分岐
├── types/
│   ├── common.ts         # ImageInput, naming_strategy, organize_by など共通 schema
│   ├── image.ts          # GenerateBase + GenerateGpt1 + GenerateGpt2 + Union, aspectRatioToSize{Gpt1,Gpt2}
│   └── edit.ts           # EditBase + EditGpt1 + EditGpt2 + Union, BatchEdit
└── utils/
    ├── openai.ts         # generateImage / editImage / batchEdit を model で分岐
    ├── image-input.ts    # 既存維持
    ├── file-manager.ts   # 既存維持
    └── validation.ts     # 既存維持
```

## Schema 詳細

### `aspect_ratio` のモデル別プリセット

| 値 | gpt-image-1 | gpt-image-2 | 物理サイズ（gpt-image-2） |
|---|---|---|---|
| `square` / `1:1` | OK | OK | 1024x1024 |
| `landscape` / `16:9` | OK | OK | 1536x1024 |
| `portrait` / `9:16` | OK | OK | 1024x1536 |
| `square_2k` | NG | OK | 2048x2048 |
| `landscape_2k` | NG | OK | 2048x1152 |
| `portrait_2k` | NG | OK | 1152x2048 |
| `auto` | NG | OK | OpenAI に委ねる（`size: "auto"` を直接渡す） |

`landscape_2k` / `portrait_2k` の長辺は 2048、短辺は 16 の倍数（1152 = 16 × 72）かつ 16:9 寄りの値とする。長辺・短辺いずれも 16 の倍数 / 比率 ≤ 3:1 / 総ピクセル 655,360〜8,294,400 を満たす。

### `quality` のモデル別 enum

| モデル | 受け入れる値 |
|---|---|
| gpt-image-1 | `standard / hd / high / medium / low`（既存、`mapLegacyQuality` で legacy → low/medium/high に正規化） |
| gpt-image-2 | `low / medium / high / auto` |

### `background`（edit のみ）

| モデル | 受け入れる値 |
|---|---|
| gpt-image-1 | `auto`（既存維持） |
| gpt-image-2 | `opaque / automatic / auto` |

### `source_image`（edit のみ）

```ts
const ImageInput = z.discriminatedUnion("type", [
  z.object({ type: z.literal("url"), value: z.string().url() }),
  z.object({ type: z.literal("base64"), value: z.string() }),
  z.object({ type: z.literal("local"), value: z.string() }),
]);

// gpt-image-1 ブランチ: 単一のみ
source_image: ImageInput

// gpt-image-2 ブランチ: 単一 or 配列（最大10枚）
source_image: z.union([ImageInput, z.array(ImageInput).min(1).max(10)])
```

### Zod schema 構造

```ts
const GenerateBase = z.object({
  prompt: z.string(),
  output_format: z.enum(["png", "jpeg", "webp"]).default("png"),
  moderation: z.enum(["auto", "low"]).default("auto"),
  include_base64: z.boolean().default(false),
  save_to_file: z.boolean().default(true),
  output_directory: z.string().optional(),
  filename: z.string().optional(),
  naming_strategy: z.enum(["timestamp", "prompt", "custom", "hash"]).default("timestamp"),
  organize_by: z.enum(["none", "date", "aspect_ratio", "quality"]).default("none"),
  remove_background: z.boolean().default(false),
});

const GenerateGpt1 = GenerateBase.extend({
  model: z.literal("gpt-image-1"),
  aspect_ratio: z.enum(["square","landscape","portrait","1:1","16:9","9:16"]).default("square"),
  quality: z.enum(["standard","hd","high","medium","low"]).optional(),
});

const GenerateGpt2 = GenerateBase.extend({
  model: z.literal("gpt-image-2"),
  aspect_ratio: z.enum([
    "square","landscape","portrait","1:1","16:9","9:16",
    "square_2k","landscape_2k","portrait_2k","auto",
  ]).default("square"),
  quality: z.enum(["low","medium","high","auto"]).optional(),
});

export const GenerateImageInputSchema = z.preprocess(
  (val) =>
    typeof val === "object" && val !== null && !("model" in val)
      ? { ...val, model: "gpt-image-2" }
      : val,
  z.discriminatedUnion("model", [GenerateGpt1, GenerateGpt2]),
);
```

`edit.ts` も同パターン。`EditBase + EditGpt1 + EditGpt2 + preprocess + discriminatedUnion`。

## MCP ツール公開仕様

`zod-to-json-schema` を使い、Zod schema から JSON Schema 7 を自動生成する：

```ts
import { zodToJsonSchema } from "zod-to-json-schema";

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate-image",
      description: "Generate images using gpt-image-1 or gpt-image-2 (default: gpt-image-2). Advanced text rendering and instruction following.",
      inputSchema: zodToJsonSchema(GenerateImageInputSchema, {
        target: "jsonSchema7",
        $refStrategy: "none",
      }) as Tool["inputSchema"],
    },
    // edit-image, batch-edit も同様
  ],
}));
```

`z.discriminatedUnion` は `oneOf` に変換され、`model` の各 literal は `const` に展開される。`$refStrategy: "none"` で参照を展開し、MCP クライアントの `$ref` 解決ばらつきを回避する。

`z.preprocess` の挙動：`zod-to-json-schema` は preprocess の内側 schema を出力するため、公開 inputSchema の `model` は各分岐で required となる。これは LLM クライアントへの明示性を高めるため許容する（実行時には Zod 側 preprocess がデフォルト値を注入する）。

## OpenAIService の分岐ロジック

### `generateImage`

```ts
async generateImage(input: GenerateImageInput): Promise<OptimizedGenerateImageResponse> {
  if (input.model === "gpt-image-1") {
    return this.generateGpt1(input);
  }
  return this.generateGpt2(input);
}

private async generateGpt2(input: GenerateImageGpt2Input) {
  const size = aspectRatioToSizeGpt2(input.aspect_ratio); // "1024x1024" | ... | "2048x2048" | "auto"
  const params: OpenAI.ImageGenerateParams = {
    model: "gpt-image-2",
    prompt: input.prompt,
    size,
    n: 1,
    ...(input.quality && { quality: input.quality }),
    ...(input.output_format && { output_format: input.output_format }),
    ...(input.moderation && { moderation: input.moderation }),
  };
  // 既存と共通: レスポンス処理、file save、metadata、warnings
}
```

`size: "auto"` の場合、`metadata.width / metadata.height` は 0 とし、warnings に「実サイズはファイルから確認してください」を追加。後続フェーズで `image-size` パッケージなどでファイルから実寸を取る改善余地を残す。

### `editImage`

gpt-image-2 ブランチで `source_image` が配列の場合、`File[]` に変換して `images.edit` に渡す：

```ts
const sources = Array.isArray(input.source_image)
  ? input.source_image
  : [input.source_image];

const imageFiles = await Promise.all(
  sources.map(async (s, i) => {
    const buf = await loadImageAsBuffer(normalizeImageInput(s));
    return new File([new Uint8Array(buf)], `source_${i}.png`, { type: "image/png" });
  }),
);

const response = await this.client.images.edit({
  model: "gpt-image-2",
  image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
  prompt: input.edit_prompt,
  size: aspectRatioToSizeGpt2(/* ... */),
  ...(input.quality && { quality: input.quality }),
  ...(input.background && { background: input.background }),
});
```

gpt-image-1 ブランチは現状ロジックを維持（単一画像のみ）。

### `batchEdit`

`batch-edit` ツールは既存通り「複数画像に同じ edit を適用」する。`generate` / `edit` のような discriminated union ではなく、**ベース schema にオプショナル `model` フィールドを 1 つ追加**するシンプルな構成とする：

```ts
const BatchEditInputSchema = z.object({
  model: z.enum(["gpt-image-1", "gpt-image-2"]).default("gpt-image-2"),
  // ... 既存フィールド
});
```

batch-edit は既に `edit_type` を独自 enum で制限しており、aspect_ratio や source_image 形状もシンプルな単一画像配列に限定するため、モデル別の能力差を schema に反映する必要はない。内部の `editImage` 呼び出し時に、各 image を gpt-image-2 ブランチの単一 `source_image` として渡す（配列入力でのコンポジションは batch-edit では行わない）。

## エラーハンドリング

既存の `handleOpenAIError` / `handleImageEditError` をそのまま使用。追加観点：

- OpenAI が `model_not_found`（404）を返した場合 → 既存の汎用エラーフォーマットでラップ
- gpt-image-2 で `image: File[]` が SDK バージョン非対応の場合 → 起動時 or 初回呼び出し時に検出してエラーを投げる（design risk セクション参照）

## テスト戦略

### 新規テスト（Vitest）

| 対象 | テスト |
|---|---|
| `types/image.ts` | `GenerateImageInputSchema.parse({prompt: "x"})` → `model: "gpt-image-2"` がデフォルト注入される |
| `types/image.ts` | `model: "gpt-image-1"` + `aspect_ratio: "square_2k"` → ZodError |
| `types/image.ts` | `model: "gpt-image-2"` + `aspect_ratio: "auto"` → OK |
| `types/image.ts` | `model: "gpt-image-1"` + `quality: "auto"` → ZodError |
| `types/image.ts` | `aspectRatioToSizeGpt2("square_2k")` → `"2048x2048"` |
| `types/image.ts` | `aspectRatioToSizeGpt2("auto")` → `"auto"` |
| `types/edit.ts` | gpt-image-2 ブランチで `source_image` が単一 / 配列どちらも parse できる |
| `types/edit.ts` | gpt-image-1 ブランチで `source_image` が配列 → ZodError |
| `types/edit.ts` | gpt-image-2 ブランチで `background: "opaque"` → OK |
| `types/edit.ts` | gpt-image-1 ブランチで `background: "opaque"` → ZodError |
| `utils/openai.ts` | `generateImage` が `model` で正しい branch / params を組み立てる（OpenAI client モック） |
| `utils/openai.ts` | gpt-image-2 edit に画像配列を渡したとき `images.edit` に配列が渡る |
| `utils/openai.ts` | `size: "auto"` の場合の metadata フォールバック（width=height=0、warning 付与） |
| `index.ts` | `zodToJsonSchema` の出力に `oneOf` で2分岐が含まれる（snapshot test） |

### 既存テストの追従

- `mapLegacyQuality` / 既存 `aspectRatioToSize` を呼んでいるテストは新 API（`aspectRatioToSizeGpt1`）に追従
- `OpenAIService` のテストは `model` 必須化に伴い、固定で `model: "gpt-image-2"` または `"gpt-image-1"` を渡す形に更新

## パッケージ rename

| ファイル | 変更内容 |
|---|---|
| `package.json` | `name: "@napolab/gpt-image-mcp"`, `bin: { "gpt-image-mcp": "./dist/index.js" }` |
| `src/index.ts` | `Server({ name: "gpt-image-mcp", ... })` |
| `README.md` | 全 `gpt-image-1-mcp` 言及をプロジェクト名として `gpt-image-mcp` に更新（モデル名としての `gpt-image-1` は残す） |
| `CHANGELOG.md` | 次バージョン（2.0.0 想定）のエントリー追加 |
| `docs/` | VitePress 設定とコンテンツの参照名を更新 |
| `tsup.config.ts` | 出力ファイル名は `dist/index.js` のまま |

旧パッケージ `@napolab/gpt-image-1-mcp` のメタデータ操作は本 PR の範囲外。

## リスクと未確定事項

1. **OpenAI SDK のバージョン**: `images.edit` の `image` パラメータが配列を受けるかは SDK 4.x では未確認。`v4.x` で動かなければ SDK を最新（v5+）にアップグレードが必要。実装フェーズ 1 の依存追加と同時に確認し、アップグレードが必要なら本 PR に含める
2. **`size: "auto"` の metadata**: 最小実装では `width = height = 0` + warning。将来 `image-size` 等で改善
3. **`zod-to-json-schema` 出力と MCP クライアント互換性**: 一部クライアントが `oneOf` を解釈しない可能性 → snapshot テストと Claude Desktop / Claude Code での smoke test で検証
4. **`mapLegacyQuality` の扱い**: gpt-image-1 ブランチでのみ適用。gpt-image-2 では `standard/hd` を受け付けない
5. **dated snapshot**: 今回は `gpt-image-2` のみ exposing。`gpt-image-2-2026-04-21` は将来 literal を増やす形で対応

## 実装順（フェーズ）

1. **依存追加とスキャフォールド**: `pnpm add zod-to-json-schema`、`src/types/common.ts` 切り出し、OpenAI SDK バージョン確認 / 必要ならアップグレード
2. **types/image.ts リファクタ**: base + gpt1 + gpt2 + union に分割、`aspectRatioToSizeGpt1/Gpt2` 実装、テスト追加
3. **types/edit.ts リファクタ**: 同パターンで分割、`source_image` の単一 / 配列 union 追加、`background` 拡張、テスト追加
4. **OpenAIService 分岐**: `generateImage` / `editImage` を model で分岐、新 params 組み立て、テスト追加
5. **MCP entry の自動 schema 化**: `zodToJsonSchema` で `inputSchema` 生成、tool description / server name 更新、snapshot テスト
6. **batch-edit に model 追加**: `BatchEditInputSchema` に `model` フィールド、内部 editImage 呼び出しに伝搬
7. **パッケージ rename**: `package.json`, `Server` name, README, CHANGELOG
8. **動作確認**: `pnpm typecheck && pnpm lint && pnpm test`、可能なら実 API での smoke test

## 参考

- OpenAI gpt-image-2 model card: https://developers.openai.com/api/docs/models/gpt-image-2
- OpenAI image generation guide: https://developers.openai.com/api/docs/guides/image-generation
- `zod-to-json-schema`: https://github.com/StefanTerdell/zod-to-json-schema
