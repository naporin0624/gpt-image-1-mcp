/**
 * Normalizes a JSON Schema produced by zod-to-json-schema for MCP tool inputSchema:
 *
 * 1. Removes "model" from required[] in each branch of a discriminated-union schema
 *    (oneOf/anyOf), so MCP clients treat `model` as optional. The runtime z.preprocess
 *    injects model="gpt-image-2" when omitted, but the generated JSON Schema marks
 *    model as required in each branch. This helper reconciles the two views.
 *
 * 2. Ensures the top-level `type` is `"object"`. The MCP protocol requires
 *    `inputSchema.type === "object"`, but `zodToJsonSchema` emits a bare
 *    `{ anyOf: [...] }` (no top-level type) for a discriminated union root.
 *    Without this fix, MCP clients reject the tool with a schema validation error.
 */
export const withOptionalModel = (
  schema: Record<string, unknown>,
): Record<string, unknown> => {
  const branches = (schema.anyOf ?? schema.oneOf) as
    | Record<string, unknown>[]
    | undefined;

  const ensureObjectType = (
    s: Record<string, unknown>,
  ): Record<string, unknown> =>
    s.type === undefined ? { type: "object", ...s } : s;

  if (!Array.isArray(branches)) {
    return ensureObjectType(schema);
  }

  const fixedBranches = branches.map((branch) => {
    const required = branch.required;
    if (!Array.isArray(required)) {
      return branch;
    }

    return {
      ...branch,
      required: required.filter((field) => field !== "model"),
    };
  });

  const key = schema.anyOf !== undefined ? "anyOf" : "oneOf";

  return ensureObjectType({ ...schema, [key]: fixedBranches });
};
