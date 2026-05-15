# Typed Contract Propagation Agent

Use this agent when a change touches the typed data contract from persistence to UI. A Prisma change is not just a model edit; it propagates through Prisma, generated database types, Pothos/Yoga GraphQL schema, frontend GraphQL documents, generated client types, React Query hooks, cache behavior, and finally UI usage.

The core discipline: every layer should compile against the layer before it, and every public contract change should be intentionally carried all the way forward.

## Contract Chain

1. Update the Prisma schema:
   - `packages/database/prisma/schema.prisma`
   - Treat this as the persistence contract. Confirm field names, nullability, relations, indexes, defaults, enum values, and migration implications.

2. Create and apply the Prisma migration:
   - `npx prisma migrate dev --schema packages/database/prisma/schema.prisma`
   - Review the generated SQL before trusting it for destructive changes, relation rewrites, enum changes, or required columns.

3. Regenerate Prisma client and Pothos Prisma types:
   - `npm --workspace @repo/database run generate`
   - This updates Prisma output and `packages/database/src/generated/pothos.ts`.

4. Update Pothos object, query, and mutation fields:
   - `cdk-app/lambda_functions/graphql-api/schema/*.ts`
   - Add or change object fields, input fields, query fields, mutation fields, enum exposure, and relation fields.
   - Preserve GraphQL nullability intentionally; do not blindly mirror database nullability when API behavior should differ.

5. Update resolver logic:
   - Usually in the same `schema/*.ts` file as the Pothos field.
   - Use `graphql-context.ts` when request or user context is needed.
   - Confirm auth, ownership, filtering, validation, and error behavior at the resolver boundary.

6. Confirm Yoga/Pothos SDL output changed correctly:
   - Run root codegen after schema changes.
   - Check `client-app/src/api/generated/schema.graphql`.
   - Make sure the SDL exposes exactly the contract the frontend should consume.

7. Update frontend GraphQL operations:
   - `client-app/src/api/<feature>/operations.ts`
   - Put `graphql(...)` documents under:
     - `// Typed GraphQL documents for this feature's operations.`
   - Put exported request functions under:
     - `// API operations consumed by hooks and other feature callers.`
   - Request only the fields needed by the UI or hook model layer.

8. Run GraphQL Codegen:
   - `npm run codegen`
   - Updates `client-app/src/api/generated/`.
   - Treat generated TypeScript failures as contract drift, not as nuisance errors.

9. Add or update frontend model helpers if needed:
   - `client-app/src/api/<feature>/model.ts`
   - Use this for normalization, derived frontend types, mappers, and stable display models.

10. Add or update React Query hooks:
    - `client-app/src/api/<feature>/hooks.ts`
    - Queries use `useQuery`.
    - Mutations use `useMutation`.
    - Export query keys from here when other code needs invalidation.

11. Fix typed hook usage in UI:
    - Components should import from `client-app/src/api/<feature>/hooks.ts`.
    - Components should not import raw operations unless there is a deliberate non-React use case.
    - Keep loading, error, empty, disabled, and success states aligned with the generated types.

12. Invalidate or update React Query cache after mutations:
    - Prefer invalidating the smallest relevant exported query key.
    - Example: `queryClient.invalidateQueries({ queryKey: currentUserQueryKey })`.
    - For immediate UX, update cache directly only when the object identity and affected query shapes are clear.

13. Test the full propagation path:
    - Database migration applies.
    - Backend resolver returns expected data.
    - Yoga/Pothos SDL includes the intended change.
    - GraphQL Codegen succeeds.
    - Generated GraphQL types compile.
    - Hook loading/error/success states behave correctly.
    - Run `npm --workspace client-app run build`.

## Common Change Types

- New persisted field: Prisma field -> migration -> Pothos object exposure -> query document selection -> generated frontend type -> UI render.
- New mutation: Prisma write shape -> Pothos input/mutation -> resolver validation/auth -> frontend operation -> mutation hook -> cache invalidation -> UI states.
- New relation: Prisma relation and indexes -> generated Pothos relation field -> resolver include/select strategy -> GraphQL query shape -> frontend model normalization.
- Enum change: Prisma enum -> generated types -> Pothos enum exposure -> frontend generated union/type checks -> UI labels and fallbacks.
- Nullability change: database optionality -> GraphQL nullable/non-null decision -> frontend guards and empty states.

## Frontend API Folder Pattern

```txt
client-app/src/api/
  <feature>/
    operations.ts  # GraphQL documents and raw API calls
    hooks.ts       # React Query hooks and query keys
    model.ts       # optional normalization/types/helpers
  generated/       # GraphQL Codegen output
  graphql/         # shared GraphQL client
```

## Review Checklist

- Does the database shape support the API contract without hidden optionality or missing indexes?
- Did generated Prisma and Pothos types update after the schema change?
- Does the GraphQL SDL show the intended fields, inputs, enums, and nullability?
- Do frontend operations compile against generated GraphQL types?
- Are React Query keys exported and invalidated at the narrowest useful scope?
- Did UI code consume hooks/models instead of raw GraphQL calls?
- Did the full path get verified with codegen and a client build?
