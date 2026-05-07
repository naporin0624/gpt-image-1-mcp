# gpt-image-2 サポート設計

- 作成日: 2026-05-07
- 対象リポジトリ: `naporin0624/gpt-image-1-mcp`
- ステータス: ドラフト（ユーザーレビュー待ち）

## 背景

OpenAI が `gpt-image-2`（および dated snapshot `gpt-image-2-2026-04-21`）をリリースした。本 MCP サーバーは現在 `gpt-image-1` のみをハードコーディングして使用しており、新モデルの能力（任意サイズ、`auto` size、複数画像入力によるコンポジション、`background: transparent/opaque/auto`）を活用できない。

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

| 値                   | gpt-image-1 | gpt-image-2 | 物理サイズ（gpt-image-2）                    |
| -------------------- | ----------- | ----------- | -------------------------------------------- |
| `square` / `1:1`     | OK          | OK          | 1024x1024                                    |
| `landscape` / `16:9` | OK          | OK          | 1536x1024                                    |
| `portrait` / `9:16`  | OK          | OK          | 1024x1536                                    |
| `square_2k`          | NG          | OK          | 2048x2048                                    |
| `landscape_2k`       | NG          | OK          | 2048x1152                                    |
| `portrait_2k`        | NG          | OK          | 1152x2048                                    |
| `auto`               | NG          | OK          | OpenAI に委ねる（`size: "auto"` を直接渡す） |

`landscape_2k` / `portrait_2k` の長辺は 2048、短辺は 16 の倍数（1152 = 16 × 72）かつ 16:9 寄りの値とする。長辺・短辺いずれも 16 の倍数 / 比率 ≤ 3:1 / 総ピクセル 655,360〜8,294,400 を満たす。

### `quality` のモデル別 enum

**generate-image:**

| モデル      | Zod が受け入れる値                                    | 実 API へ送る値                                      |
| ----------- | ----------------------------------------------------- | ---------------------------------------------------- |
| gpt-image-1 | `standard / hd / high / medium / low`（既存後方互換） | `low / medium / high`（`mapLegacyQuality` で正規化） |
| gpt-image-2 | `low / medium / high / auto`                          | そのまま                                             |

**edit-image:**

| モデル      | Zod が受け入れる値                                                     | 実 API へ送る値 |
| ----------- | ---------------------------------------------------------------------- | --------------- |
| gpt-image-1 | `auto / high / medium / low`（既存維持、`standard / hd` は元々非対応） | そのまま        |
| gpt-image-2 | `auto / high / medium / low`                                           | そのまま        |

`mapLegacyQuality` の適用タイミング: **Zod parse の後、`OpenAIService.generateGpt1` 内**で行う（generate-image のみ。edit-image では現行 schema が既に `auto/high/medium/low` のため不要）。現行 `index.ts` で parse 前に手動適用しているロジックは削除し、責務を service 層に集約する。gpt-image-2 ブランチでは `mapLegacyQuality` を呼ばない（`standard / hd` は schema 段階で弾かれる）。

### `background`（generate と edit の両方）

現行コードでは `generate` にも `background: BackgroundSchema = transparent / opaque / auto` が存在する（`src/types/image.ts`）。これを引き継ぐ形で **両モデル共通で `generate` / `edit` のどちらにも `background` を持たせる**。

| モデル      | 受け入れる値                  | 備考                                                                                                                      |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| gpt-image-1 | `transparent / opaque / auto` | デフォルト `auto`（既存維持）                                                                                             |
| gpt-image-2 | `transparent / opaque / auto` | デフォルト `auto`。**Phase 0 検証済**：実 API が受理するのは 3 値のみ。`automatic` は 400 で拒否（`auto` の別名でもない） |

### `style`（generate のみ、後方互換）

現行 `GenerateImageInputSchema` には `style: vivid / natural`（DALL-E 3 由来の vestigial フィールド）がある。gpt-image-1 / gpt-image-2 のいずれの API にも該当パラメータはないため、**両モデルブランチで受理するが API には送信しない**形で維持（後方互換のため schema を壊さない）。将来削除する場合は別 PR とする。

### `source_image`（edit のみ）

```ts
const ImageInput = z.discriminatedUnion("type", [
  z.object({ type: z.literal("url"), value: z.string().url() }),
  z.object({ type: z.literal("base64"), value: z.string() }),
  z.object({ type: z.literal("local"), value: z.string() }),
]);

// gpt-image-1 ブランチ: 単一のみ
source_image: ImageInput;

// gpt-image-2 ブランチ: 単一 or 配列（最大10枚）
source_image: z.union([ImageInput, z.array(ImageInput).min(1).max(10)]);
```

### Zod schema 構造

```ts
const GenerateBase = z.object({
  prompt: z.string(),
  output_format: z.enum(["png", "jpeg", "webp"]).default("png"),
  moderation: z.enum(["auto", "low"]).default("auto"),
  background: z.enum(["transparent", "opaque", "auto"]).default("auto"),
  style: z.enum(["vivid", "natural"]).optional(), // 後方互換、API には送信しない
  include_base64: z.boolean().default(false),
  save_to_file: z.boolean().default(true),
  output_directory: z.string().optional(),
  filename: z.string().optional(),
  naming_strategy: z
    .enum(["timestamp", "prompt", "custom", "hash"])
    .default("timestamp"),
  organize_by: z
    .enum(["none", "date", "aspect_ratio", "quality"])
    .default("none"),
  remove_background: z.boolean().default(false),
});

const GenerateGpt1 = GenerateBase.extend({
  model: z
    .literal("gpt-image-1")
    .describe("Model to use. Omit to default to gpt-image-2."),
  aspect_ratio: z
    .enum(["square", "landscape", "portrait", "1:1", "16:9", "9:16"])
    .default("square"),
  quality: z.enum(["standard", "hd", "high", "medium", "low"]).optional(),
});

const GenerateGpt2 = GenerateBase.extend({
  model: z
    .literal("gpt-image-2")
    .describe("Model to use. Omit to default to gpt-image-2."),
  aspect_ratio: z
    .enum([
      "square",
      "landscape",
      "portrait",
      "1:1",
      "16:9",
      "9:16",
      "square_2k",
      "landscape_2k",
      "portrait_2k",
      "auto",
    ])
    .default("square"),
  quality: z.enum(["low", "medium", "high", "auto"]).optional(),
});

export const GenerateImageInputSchema = z.preprocess(
  (val) =>
    typeof val === "object" && val !== null && !("model" in val)
      ? { ...val, model: "gpt-image-2" }
      : val,
  z.discriminatedUnion("model", [GenerateGpt1, GenerateGpt2]),
);
```

`z.preprocess` のラップにより `z.infer<typeof GenerateImageInputSchema>` は内側 union 型（`GenerateGpt1 | GenerateGpt2`）となり、TypeScript の型上は `model` が required になる。これは仕様として許容する：呼び出し側 service 層では union を受け取って switch で分岐するため、required 表現の方がむしろ安全。

`edit.ts` も同じパターンで構成する：

```ts
const EditBase = z.object({
  edit_prompt: z.string(),
  edit_type: z.enum([
    "inpaint",
    "outpaint",
    "variation",
    "style_transfer",
    "object_removal",
    "background_change",
  ]),
  background: z.enum(["transparent", "opaque", "auto"]).default("auto"),
  output_format: z.enum(["png", "jpeg", "webp"]).default("png"),
  strength: z.number().min(0).max(1).default(0.8),
  preserve_composition: z.boolean().default(true),
  // ファイル保存系（save_to_file, output_directory, filename_prefix, naming_strategy, organize_by）
  // mask_area もここ
});

const EditGpt1 = EditBase.extend({
  model: z.literal("gpt-image-1"),
  source_image: ImageInput,
  // 現行 EditImageInputSchema の quality は既に auto/high/medium/low なので両モデル同一でよい
  quality: z.enum(["auto", "high", "medium", "low"]).optional().default("auto"),
});

const EditGpt2 = EditBase.extend({
  model: z.literal("gpt-image-2"),
  source_image: z.union([ImageInput, z.array(ImageInput).min(1).max(10)]),
  quality: z.enum(["auto", "high", "medium", "low"]).optional().default("auto"),
});
```

## MCP ツール公開仕様

`zod-to-json-schema` を使い、Zod schema から JSON Schema 7 を自動生成する：

```ts
import { zodToJsonSchema } from "zod-to-json-schema";

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate-image",
      description:
        "Generate images using gpt-image-1 or gpt-image-2. " +
        "If `model` is omitted, gpt-image-2 is used by default.",
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

### `z.preprocess` と JSON Schema の不整合への対策

`zod-to-json-schema` は `z.preprocess` の変換関数を JSON Schema に表現できないため、出力 JSON Schema 上は `model` フィールドが各分岐で required となる。MCP クライアント側 schema validation で `model` 未指定リクエストが弾かれるリスクがあるため、**以下の対策を実装する**：

1. **`z.literal(...).describe(...)` で明示**: 各 `model` リテラルに `"Model to use. Omit to default to gpt-image-2."` の description を付け、JSON Schema に含める（LLM が省略可能と理解できる手がかりになる）
2. **ツール description 自体に明記**: `description` 文字列に「`model` を省略した場合 gpt-image-2 が使われる」と記載
3. **post-process で `model` を required から外す**: `zodToJsonSchema` 出力の `oneOf[].required` から `model` を除去するヘルパー関数 `withOptionalModel(jsonSchema)` を実装する

```ts
function withOptionalModel(
  schema: ReturnType<typeof zodToJsonSchema>,
): typeof schema {
  // schema.oneOf[i].required から "model" を取り除いた schema を返す
  // model フィールド自体（properties.model）は残す
}
```

これにより、JSON Schema 上は `model` が optional に見え、Zod 側 preprocess が実行時に `gpt-image-2` を注入する挙動と一致する。

### `source_image` の二重ネスト `oneOf` への対策

`EditGpt2` の `source_image: z.union([ImageInput, z.array(ImageInput)])` は、外側 discriminated union `oneOf` の中にさらに `oneOf` または `anyOf` が入るネスト構造になる。一部 MCP クライアントでこのネストが解釈できない可能性があるため：

- **snapshot test で構造を固定**: `tests/mcp-schema.test.ts` で edit-image inputSchema の `oneOf` ネスト深さを検証
- **Claude Desktop / Claude Code で smoke test**: 実クライアントで `source_image` 単一 / 配列両方の呼び出しを確認（Phase 0 / Phase 8）
- **構造が壊れる場合のフォールバック**: `source_image` を常に配列で受ける形（単一でも `[image]` を要求）に変更する案も用意しておく

## OpenAIService の分岐ロジック

### `generateImage`

```ts
async generateImage(input: GenerateImageInput): Promise<OptimizedGenerateImageResponse> {
  if (input.model === "gpt-image-1") {
    return this.generateGpt1(input);
  }
  return this.generateGpt2(input);
}

private async generateGpt1(input: GenerateImageGpt1Input) {
  const size = aspectRatioToSizeGpt1(input.aspect_ratio);
  const normalizedQuality = input.quality
    ? mapLegacyQuality(input.quality)  // "standard" -> "medium", "hd" -> "high"
    : undefined;
  const params: OpenAI.ImageGenerateParams = {
    model: "gpt-image-1",
    prompt: input.prompt,
    size,
    n: 1,
    ...(normalizedQuality && { quality: normalizedQuality }),
    ...(input.output_format && { output_format: input.output_format }),
    ...(input.moderation && { moderation: input.moderation }),
    ...(input.background !== "auto" && { background: input.background }),
  };
  // style, remove_background は API には送信しない（service 内のフラグとして扱う or 無視）
  // 以下、共通: レスポンス処理、file save、metadata、warnings
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
    ...(input.background !== "auto" && { background: input.background }),
  };
  // 既存と共通: レスポンス処理、file save、metadata、warnings
}
```

**`mapLegacyQuality` の責務分離**: 現行 `index.ts` の handler 内で行っている `mapLegacyQuality` 適用ロジックは削除し、`generateGpt1` 内に集約する（gpt-image-2 ブランチでは適用不要、schema 段階で `standard/hd` は弾かれる）。

`size: "auto"` の場合、`metadata.width / metadata.height` は 0 とし、warnings に「実サイズはファイルから確認してください」を追加。後続フェーズで `image-size` パッケージなどでファイルから実寸を取る改善余地を残す。

### `editImage`

```ts
async editImage(input: EditImageInput): Promise<EditImageResult> {
  if (input.model === "gpt-image-1") {
    return this.editImageGpt1(input);
  }
  return this.editImageGpt2(input);
}

private async editImageGpt2(input: EditImageGpt2Input) {
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
    size: "1024x1024",  // edit ではアスペクト比をソース画像から推定するため固定
    n: 1,
    ...(input.quality && { quality: input.quality }),
    ...(input.background !== "auto" && { background: input.background }),
  });
  // 以下、共通: レスポンス処理、file save、metadata
}
```

gpt-image-1 ブランチ (`editImageGpt1`) は現状ロジックを維持（単一画像のみ、`mapLegacyQuality` は edit には不要 ※ edit の `quality` は元々 schema 上 `low/medium/high/auto` のため）。

### `batchEdit`

`batch-edit` ツールは既存通り「複数画像に同じ edit を適用」する。`generate` / `edit` のような discriminated union ではなく、**ベース schema にオプショナル `model` フィールドを 1 つ追加**するシンプルな構成とする：

```ts
const BatchEditInputSchema = z.object({
  model: z.enum(["gpt-image-1", "gpt-image-2"]).default("gpt-image-2"),
  // ... 既存フィールド
});
```

batch-edit は既に `edit_type` を独自 enum（`style_transfer / background_change / color_adjustment / enhancement`）で制限しており、aspect_ratio や source_image 形状もシンプルな単一画像配列に限定するため、モデル別の能力差を schema に反映する必要はない。

**`edit_type` の不整合対応（重要）**: 現行 `BatchEditInputSchema.edit_type` は 4 値で、`EditImageInputSchema.edit_type` は 6 値（`inpaint / outpaint / variation / style_transfer / object_removal / background_change`）。内部で `editImage` を呼ぶ際、`color_adjustment / enhancement` を `editImage` の値にマッピングする必要がある。現行コードの `editTypeMap` を維持し、明示的にマッピングテーブルを定義：

```ts
const BATCH_TO_EDIT_TYPE: Record<BatchEditType, EditType> = {
  style_transfer: "style_transfer",
  background_change: "background_change",
  color_adjustment: "variation",
  enhancement: "variation",
};
```

このマッピングはユニットテストで保護する。

内部の `editImage` 呼び出し時、各 image を gpt-image-2 ブランチの単一 `source_image` として渡す（配列入力でのコンポジションは batch-edit では行わない）。

## エラーハンドリング

既存の `handleOpenAIError` / `handleImageEditError` をそのまま使用。追加観点：

- OpenAI が `model_not_found`（404）を返した場合 → 既存の汎用エラーフォーマットでラップ
- gpt-image-2 で `image: File[]` が SDK バージョン非対応の場合 → 起動時 or 初回呼び出し時に検出してエラーを投げる（design risk セクション参照）

## テスト戦略

### 新規テスト（Vitest）

| 対象              | テスト                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `types/image.ts`  | `GenerateImageInputSchema.parse({prompt: "x"})` → `model: "gpt-image-2"` がデフォルト注入される |
| `types/image.ts`  | `model: "gpt-image-1"` + `aspect_ratio: "square_2k"` → ZodError                                 |
| `types/image.ts`  | `model: "gpt-image-2"` + `aspect_ratio: "auto"` → OK                                            |
| `types/image.ts`  | `model: "gpt-image-1"` + `quality: "auto"` → ZodError                                           |
| `types/image.ts`  | `model: "gpt-image-2"` + `quality: "standard"` → ZodError                                       |
| `types/image.ts`  | `aspectRatioToSizeGpt2("square_2k")` → `"2048x2048"`（Phase 0 の確定値に合わせる）              |
| `types/image.ts`  | `aspectRatioToSizeGpt2("auto")` → `"auto"`                                                      |
| `types/image.ts`  | 両モデルブランチで `style: "vivid"` parse 通過、`background: "transparent"` parse 通過          |
| `types/edit.ts`   | gpt-image-2 ブランチで `source_image` が単一 / 配列（1〜10枚）どちらも parse できる             |
| `types/edit.ts`   | gpt-image-2 ブランチで `source_image` 11枚配列 → ZodError                                       |
| `types/edit.ts`   | gpt-image-1 ブランチで `source_image` が配列 → ZodError                                         |
| `types/edit.ts`   | 両モデルブランチで `background: "transparent" / "opaque" / "auto"` parse 通過                   |
| `utils/openai.ts` | `generateImage` が `model` で正しい branch / params を組み立てる（OpenAI client モック）        |
| `utils/openai.ts` | `generateGpt1` 内で `quality: "standard"` が `"medium"` に変換されて API に渡る                 |
| `utils/openai.ts` | `generateGpt1` 内で `quality: "hd"` が `"high"` に変換されて API に渡る                         |
| `utils/openai.ts` | `generateGpt2` で `quality: "auto"` がそのまま API に渡る                                       |
| `utils/openai.ts` | `generateGpt2` で `style` フィールドは API パラメータに含まれない                               |
| `utils/openai.ts` | gpt-image-2 edit に画像配列を渡したとき `images.edit` の `image` に File 配列が渡る             |
| `utils/openai.ts` | gpt-image-2 edit に単一画像を渡したとき `image` に単一 File が渡る                              |
| `utils/openai.ts` | `size: "auto"` の場合の metadata フォールバック（width=height=0、warning 付与）                 |
| `utils/openai.ts` | `BATCH_TO_EDIT_TYPE` マッピングが全 batch edit_type を網羅                                      |
| `utils/openai.ts` | batch-edit が `model: "gpt-image-1"` 指定で gpt-image-1 ブランチを呼ぶ                          |
| `index.ts`        | `zodToJsonSchema` の出力に `oneOf` で2分岐が含まれる（snapshot test）                           |
| `index.ts`        | `withOptionalModel` 適用後、各 `oneOf` 分岐の `required` から `model` が除外される              |
| `index.ts`        | edit-image inputSchema の `source_image` ネスト構造が想定通り（snapshot）                       |

### 既存テストの追従

- `mapLegacyQuality` / 既存 `aspectRatioToSize` を呼んでいるテストは新 API（`aspectRatioToSizeGpt1`）に追従
- `OpenAIService` のテストは `model` 必須化に伴い、固定で `model: "gpt-image-2"` または `"gpt-image-1"` を渡す形に更新

## パッケージ rename

「プロジェクト名」と「モデル名」を分離する：プロジェクト名 (`gpt-image-1-mcp` / `@napolab/gpt-image-1-mcp`) は `gpt-image-mcp` / `@napolab/gpt-image-mcp` に変更、モデル名としての `gpt-image-1` の文章上の言及は残す。

### 必須変更ファイル一覧

| ファイル                                                                                 | 変更内容                                                                                                                                             |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                                                           | `name: "@napolab/gpt-image-mcp"`, `bin: { "gpt-image-mcp": "./dist/index.js" }`, `keywords` に `"gpt-image-2"` を追加（`"gpt-image-1"` は残す）      |
| `src/index.ts`                                                                           | `Server({ name: "gpt-image-mcp", ... })`                                                                                                             |
| `README.md`                                                                              | プロジェクト名としての全言及を更新、インストールコマンド例を `npx @napolab/gpt-image-mcp` に                                                         |
| `CHANGELOG.md`                                                                           | 次バージョン（2.0.0 想定）のエントリー追加（破壊的変更の明記）                                                                                       |
| `tsup.config.ts`                                                                         | 出力ファイル名は `dist/index.js` のまま（変更不要）                                                                                                  |
| `docs/.vitepress/config.ts`                                                              | `title: "gpt-image MCP"`, `base: "/gpt-image-mcp/"`, `head` の icon href, `themeConfig.logo`, ナビ・サイドバー上の文字列、socialLinks の GitHub link |
| `docs/index.md`                                                                          | hero `name`, tagline, features の `gpt-image-1 Powered`、設定例 JSON のキー名と args、本文中の "gpt-image-1 MCP" 表記                                |
| `docs/guide/getting-started.md`                                                          | `claude mcp add gpt-image-1` → `gpt-image-mcp`、`npx @napolab/gpt-image-1-mcp` → `@napolab/gpt-image-mcp`、JSON 設定キー                             |
| `docs/guide/what-is-mcp.md`                                                              | プロジェクト名としての言及を全更新                                                                                                                   |
| `docs/guide/environment-variables.md`                                                    | 全 JSON 設定例（6箇所程度）の MCP server キー名と args                                                                                               |
| `docs/guide/mcp-configuration.md`                                                        | 全 JSON 設定例（20行以上）                                                                                                                           |
| `docs/guide/edit-image.md`, `docs/guide/batch-edit.md`, `docs/guide/image-generation.md` | プロジェクト名と設定例の参照                                                                                                                         |
| `docs/api/*.md`（`tools.md` / `error-handling.md` / `rate-limiting.md` 等）              | `gpt-image-1-mcp` への言及を更新                                                                                                                     |
| `docs/examples/*.json`（存在する場合）                                                   | MCP サーバーキー `"gpt-image-1-mcp"` と args                                                                                                         |
| `.github/workflows/deploy-docs.yml`                                                      | GitHub Pages の base path や artifact 名に `gpt-image-1-mcp` がハードコードされている場合は更新                                                      |
| `.github/workflows/ci.yml`                                                               | プロジェクト名のハードコード参照があれば更新                                                                                                         |

### 範囲外として扱う項目

- 旧パッケージ `@napolab/gpt-image-1-mcp` の npm 上での deprecated 化 → 別アクション
- `features/*.yml`（過去の planning 文書）→ 履歴として保存、本 PR では更新しない
- GitHub リポジトリの Pages 設定（base URL 変更後の Pages 設定）→ 手動操作が必要、PR メッセージで案内する

### 検出漏れ防止

実装フェーズで `rg "gpt-image-1-mcp"` と `rg "@napolab/gpt-image-1-mcp"` をリポジトリ全体に対して実行し、上表に含まれない参照がないか確認する。`features/` 配下のヒットは過去文書として除外。

## UNVERIFIED 項目（Phase 0 で検証）

以下は OpenAI 公式ドキュメント / 実 API での検証が必要な項目。Phase 0（API 検証ゲート）で確認し、結果に応じて schema や実装を調整する：

| 項目                                                              | 想定                                 | 検証方法                                         | 結果 (2026-05-07)                                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `gpt-image-2` で `size: "auto"` を受け付けるか                    | 受け付ける                           | 実 API 呼び出し                                  | ✅ 受理（warning 経由で metadata は 0/0 のまま、ファイルは生成される）                                                     |
| `landscape_2k` の正確な物理サイズ                                 | `2048x1152`                          | 実 API 呼び出し                                  | ✅ `2048x1152` で生成                                                                                                      |
| `portrait_2k` の正確な物理サイズ                                  | `1152x2048`                          | 同上                                             | ✅ `square_2k=2048x2048` で確認、対称性から確定                                                                            |
| `background: "transparent"` を gpt-image-2 が受け付けるか         | 受け付ける                           | 実 API 呼び出し                                  | ✅ 受理（PNG 生成成功）                                                                                                    |
| `background: "automatic"` の正式有無                              | `auto` の別名と推定                  | 実 API 呼び出しで直接 `automatic` を渡し挙動確認 | ❌ **400 で拒否**。OpenAI 公式 enum は `transparent / opaque / auto` の 3 値のみ。`automatic` は別名でもなく独立値でもない |
| `moderation: "auto" / "low"` を gpt-image-2 が受け付けるか        | 受け付ける                           | 実 API 呼び出し                                  | ✅ `moderation: "auto"` 経由で生成成功                                                                                     |
| `images.edit` の `image` に File 配列を渡せるか（OpenAI SDK 4.x） | SDK アップグレードが必要な可能性あり | SDK 型定義確認 + 実 API 呼び出し                 | ✅ `openai@4.104.0` の型定義が `Core.Uploadable \| Array<Core.Uploadable>` で配列を受理、コンポジション生成成功            |
| `gpt-image-2` で `output_compression` パラメータが必要か          | 今回は exposing しない               | 必要なら別チケット                               | ⏸ exposing 対象外、未検証で OK                                                                                            |

すべての UNVERIFIED 項目は 2026-05-07 の `scripts/smoke.ts` / `scripts/smoke-background.ts` 実行で検証済。schema・実装変更は不要（`background: "automatic"` を含めない現状の Zod enum が API 仕様と一致）。

## その他のリスク

1. **`size: "auto"` 時の metadata**: 最小実装では `width = height = 0` + warning。将来 `image-size` パッケージ等でファイルから実寸取得する改善余地あり
2. **`zod-to-json-schema` 出力と MCP クライアント互換性**: snapshot テストと Claude Desktop / Claude Code での smoke test（Phase 8）で検証
3. **`mapLegacyQuality` の扱い**: gpt-image-1 ブランチの service 層内でのみ適用。gpt-image-2 では `standard/hd` を schema 段階で弾く
4. **dated snapshot**: 今回は `gpt-image-2` のみ exposing。`gpt-image-2-2026-04-21` は将来 literal を増やす形で対応
5. **既存 `mcp-schema.test.ts`**: 現在は手動 inputSchema を前提にしているため、Phase 3 で zodToJsonSchema 出力に合わせて更新（snapshot 形式に変更）

## 実装順（フェーズ）

### Phase 0: API 仕様検証ゲート（実装着手前）

UNVERIFIED 項目セクションの全項目を検証し、結果に応じて schema 値（特に 2K サイズ、`background` enum、`size: "auto"` 採否）を確定する。SDK アップグレード要否もここで判断。判断結果は本 spec の該当箇所をインライン更新してから Phase 1 に進む。

### Phase 1: 依存追加とスキャフォールド

- `pnpm add zod-to-json-schema`
- `src/types/common.ts` 切り出し（`ImageInput`, naming 系 enum 等）
- OpenAI SDK アップグレード（Phase 0 で必要と判断された場合）
- 新規 / 更新後のテストが Vitest で起動できることを確認

### Phase 2: types/image.ts リファクタ

- `GenerateBase` / `GenerateGpt1` / `GenerateGpt2` / `GenerateImageInputSchema` を実装
- `aspectRatioToSizeGpt1` / `aspectRatioToSizeGpt2` 実装
- types ユニットテスト追加

### Phase 3: MCP inputSchema 自動化（前倒し）

`zod-to-json-schema` で `inputSchema` を生成する基盤を Phase 2 直後に導入。手動 inputSchema との二重管理期間を最小化する：

- `withOptionalModel` ヘルパー実装
- `index.ts` の generate-image inputSchema を `zodToJsonSchema` ベースに置換
- `tests/mcp-schema.test.ts` を snapshot ベースに更新（手動 JSON 検証ロジックは削除）

この時点では `edit-image` / `batch-edit` は旧 schema 維持。後続 Phase で順次置換。

### Phase 4: types/edit.ts リファクタ

- `EditBase` / `EditGpt1` / `EditGpt2` / `EditImageInputSchema` を実装
- `source_image` の単一 / 配列 union、`background` 拡張、`mask_area` 維持
- types ユニットテスト追加
- `index.ts` の edit-image inputSchema も `zodToJsonSchema` ベースに切り替え

### Phase 5: OpenAIService 分岐

- `generateImage` を model で分岐（`generateGpt1` 内で `mapLegacyQuality` 適用）
- `editImage` を model で分岐、gpt-image-2 で File 配列入力対応
- `size: "auto"` のフォールバック挙動（metadata 0 + warning）
- service 層テスト（OpenAI client モック）追加

### Phase 6: batch-edit に model 追加

- `BatchEditInputSchema` に `model` フィールド（デフォルト `gpt-image-2`）
- `BATCH_TO_EDIT_TYPE` マッピング定義
- 内部 `editImage` 呼び出しに `model` を伝搬
- `index.ts` の batch-edit inputSchema も `zodToJsonSchema` ベースに切り替え

### Phase 7: パッケージ rename

実装ロジックと独立しているため、Phase 7 を独立したコミットとして切り出し（レビュー容易性のため）：

- `package.json` の name / bin / keywords
- `src/index.ts` の `Server({ name })`
- README, CHANGELOG, docs/ 全般、.github/workflows
- `rg "gpt-image-1-mcp"` で検出漏れチェック

### Phase 8: 動作確認

- `pnpm typecheck && pnpm lint && pnpm test` 全通過
- Claude Desktop または Claude Code を MCP クライアントとして実 API smoke test：
  - `model` 省略で gpt-image-2 が呼ばれる
  - `model: "gpt-image-1"` で gpt-image-1 が呼ばれる
  - `aspect_ratio: "square_2k"` の出力が 2048x2048
  - `edit-image` で `source_image` 配列入力 → コンポジション生成
  - `batch-edit` の動作

## 参考

- OpenAI gpt-image-2 model card: https://developers.openai.com/api/docs/models/gpt-image-2
- OpenAI image generation guide: https://developers.openai.com/api/docs/guides/image-generation
- `zod-to-json-schema`: https://github.com/StefanTerdell/zod-to-json-schema
