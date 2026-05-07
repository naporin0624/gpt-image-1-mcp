import { describe, it, expect } from "vitest";
import { zodToJsonSchema } from "zod-to-json-schema";

import { BatchEditInputSchema, EditImageInputSchema } from "../src/types/edit";
import { GenerateImageInputSchema } from "../src/types/image";
import { withOptionalModel } from "../src/utils/json-schema";

describe("zodToJsonSchema for GenerateImageInputSchema", () => {
  it("produces a JSON Schema with anyOf or oneOf for the discriminated union", () => {
    const schema = zodToJsonSchema(GenerateImageInputSchema, {
      target: "jsonSchema7",
      $refStrategy: "none",
    }) as Record<string, unknown>;

    const branches = (schema.anyOf ?? schema.oneOf) as
      | Record<string, unknown>[]
      | undefined;
    expect(Array.isArray(branches)).toBe(true);
    expect(branches?.length).toBe(2);
  });

  it("each branch encodes the model literal as a const", () => {
    const schema = zodToJsonSchema(GenerateImageInputSchema, {
      target: "jsonSchema7",
      $refStrategy: "none",
    }) as Record<string, unknown>;

    const branches = (schema.anyOf ?? schema.oneOf) as Record<
      string,
      unknown
    >[];
    const literals = branches.map((b) => {
      const props = b.properties as Record<string, Record<string, unknown>>;
      const modelField = props.model;

      return modelField?.const;
    });
    expect(literals).toEqual(
      expect.arrayContaining(["gpt-image-1", "gpt-image-2"]),
    );
  });
});

describe("withOptionalModel", () => {
  it("removes 'model' from required arrays in each oneOf/anyOf branch", () => {
    const raw = zodToJsonSchema(GenerateImageInputSchema, {
      target: "jsonSchema7",
      $refStrategy: "none",
    }) as Record<string, unknown>;

    const fixed = withOptionalModel(raw);
    const branches = (fixed.anyOf ?? fixed.oneOf) as Record<string, unknown>[];

    for (const branch of branches) {
      const required = (branch.required ?? []) as string[];
      expect(required).not.toContain("model");
    }
  });

  it("preserves the model property on each branch", () => {
    const raw = zodToJsonSchema(GenerateImageInputSchema, {
      target: "jsonSchema7",
      $refStrategy: "none",
    }) as Record<string, unknown>;

    const fixed = withOptionalModel(raw);
    const branches = (fixed.anyOf ?? fixed.oneOf) as Record<string, unknown>[];

    for (const branch of branches) {
      const props = branch.properties as Record<string, unknown>;
      expect(props.model).toBeDefined();
    }
  });

  it("does not throw on a schema that has no anyOf/oneOf", () => {
    const trivial = { type: "object", properties: { a: { type: "string" } } };
    expect(() => withOptionalModel(trivial)).not.toThrow();
  });

  it("ensures top-level type is 'object' (MCP requires inputSchema.type === 'object')", () => {
    const raw = zodToJsonSchema(GenerateImageInputSchema, {
      target: "jsonSchema7",
      $refStrategy: "none",
    }) as Record<string, unknown>;

    // Sanity: zodToJsonSchema emits no top-level type for a discriminated union
    expect(raw.type).toBeUndefined();

    const fixed = withOptionalModel(raw);
    expect(fixed.type).toBe("object");
    // The branches should still be present
    expect((fixed.anyOf ?? fixed.oneOf) as unknown[]).toHaveLength(2);
  });

  it("preserves an existing top-level type instead of overwriting it", () => {
    const trivial = { type: "object", properties: { a: { type: "string" } } };
    const fixed = withOptionalModel(trivial);
    expect(fixed.type).toBe("object");
  });
});

describe("MCP inputSchema snapshots (regression guard for tool registration)", () => {
  // The three inputSchemas wired in src/index.ts. If a snapshot drifts, MCP
  // clients may reject `tools/list` with a JSON Schema validation error
  // (notably: top-level type must be "object").
  const buildInputSchema = (
    schema: Parameters<typeof zodToJsonSchema>[0],
  ): Record<string, unknown> =>
    withOptionalModel(
      zodToJsonSchema(schema, {
        target: "jsonSchema7",
        $refStrategy: "none",
      }) as Record<string, unknown>,
    );

  it("generate-image inputSchema has top-level type: 'object'", () => {
    const schema = buildInputSchema(GenerateImageInputSchema);
    expect(schema.type).toBe("object");
  });

  it("edit-image inputSchema has top-level type: 'object'", () => {
    const schema = buildInputSchema(EditImageInputSchema);
    expect(schema.type).toBe("object");
  });

  it("batch-edit inputSchema has top-level type: 'object'", () => {
    const schema = buildInputSchema(BatchEditInputSchema);
    expect(schema.type).toBe("object");
  });

  it("matches snapshot for generate-image", () => {
    expect(buildInputSchema(GenerateImageInputSchema)).toMatchSnapshot();
  });

  it("matches snapshot for edit-image", () => {
    expect(buildInputSchema(EditImageInputSchema)).toMatchSnapshot();
  });

  it("matches snapshot for batch-edit", () => {
    expect(buildInputSchema(BatchEditInputSchema)).toMatchSnapshot();
  });
});
