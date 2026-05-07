import { describe, it, expect } from "vitest";
import { zodToJsonSchema } from "zod-to-json-schema";

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
});
