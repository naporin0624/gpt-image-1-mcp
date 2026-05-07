import { describe, it, expect } from "vitest";
import { zodToJsonSchema } from "zod-to-json-schema";

import {
  BatchEditInputSchema,
  EditImageMcpInputSchema,
} from "../src/types/edit";
import {
  GenerateImageInputSchema,
  GenerateImageMcpInputSchema,
} from "../src/types/image";
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

describe("MCP inputSchema (regression guard for tool registration)", () => {
  // src/index.ts uses dedicated "MCP" flat schemas (no discriminated union at root)
  // so Anthropic API's tool input_schema constraint is satisfied:
  //   "input_schema does not support oneOf, allOf, or anyOf at the top level".
  // Runtime parsing still uses the discriminated unions for strict validation.
  const buildInputSchema = (
    schema: Parameters<typeof zodToJsonSchema>[0],
  ): Record<string, unknown> =>
    withOptionalModel(
      zodToJsonSchema(schema, {
        target: "jsonSchema7",
        $refStrategy: "none",
      }) as Record<string, unknown>,
    );

  const inputSchemas = [
    ["generate-image", GenerateImageMcpInputSchema],
    ["edit-image", EditImageMcpInputSchema],
    ["batch-edit", BatchEditInputSchema],
  ] as const;

  it.each(inputSchemas)(
    "%s inputSchema has top-level type: 'object'",
    (_label, schema) => {
      const result = buildInputSchema(schema);
      expect(result.type).toBe("object");
    },
  );

  it.each(inputSchemas)(
    "%s inputSchema has no top-level oneOf/anyOf/allOf (Anthropic tool constraint)",
    (_label, schema) => {
      const result = buildInputSchema(schema);
      expect(result.oneOf).toBeUndefined();
      expect(result.anyOf).toBeUndefined();
      expect(result.allOf).toBeUndefined();
    },
  );

  it.each(inputSchemas)("%s inputSchema matches snapshot", (_label, schema) => {
    expect(buildInputSchema(schema)).toMatchSnapshot();
  });
});
