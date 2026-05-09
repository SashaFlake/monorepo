import { Schema, ParseResult, Either } from 'effect'

/**
 * A field-scoped validation error, decoupled from `effect`'s issue tree.
 * `field` is the last segment of the JSON path (e.g. `priority`, `name`,
 * `destinations`). For root-level filters with no field, `field` is `''`.
 */
export type SchemaValidationError = {
  field: string
  message: string
}

/**
 * Build a synchronous validator from an `effect/Schema`.
 *
 * Returns a function `(value) => SchemaValidationError[]`:
 *   - `[]`  when `value` decodes successfully
 *   - non-empty array of `{ field, message }` when it fails
 *
 * Designed as the bridge between `@tanstack/react-form` (which expects
 * a sync validator returning errors) and Effect's Schema (which is the
 * source of truth for shape + invariants).
 *
 * Example:
 *   ```ts
 *   const validate = schemaValidator(RoutingRuleSchema)
 *   const errs = validate(formValues) // [] or [{ field, message }, ...]
 *   ```
 */
export const schemaValidator =
  <A, I>(schema: Schema.Schema<A, I>) =>
  (value: unknown): SchemaValidationError[] => {
    const result = Schema.decodeUnknownEither(schema)(value, {
      // Collect every issue, not just the first — gives the user the full
      // picture instead of hiding errors behind whichever runs first.
      errors: 'all',
    })

    if (Either.isRight(result)) return []

    return ParseResult.ArrayFormatter.formatErrorSync(result.left).map(issue => ({
      // ArrayFormatter returns `path: PropertyKey[]`. The last segment is the
      // most specific field name; for root-level filters `path` is empty.
      field: issue.path.length > 0 ? String(issue.path[issue.path.length - 1]) : '',
      message: issue.message,
    }))
  }
