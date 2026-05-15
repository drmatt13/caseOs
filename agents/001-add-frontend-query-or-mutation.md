# Add A Frontend Query Or Mutation

Compact workflow for adding a new GraphQL-backed frontend query or mutation.

## Backend Schema Path

1. Update the database model if needed:
   - `packages/database/prisma/schema.prisma`

2. Create/apply the Prisma migration:
   - `npx prisma migrate dev --schema packages/database/prisma/schema.prisma`

3. Regenerate Prisma and Pothos Prisma types:
   - `npm --workspace @repo/database run generate`
   - This updates Prisma output and `packages/database/src/generated/pothos.ts`.

4. Update Pothos schema fields:
   - `cdk-app/lambda_functions/graphql-api/schema/*.ts`
   - Add or change object fields, query fields, and mutation fields.

5. Update resolver logic:
   - Usually in the same `schema/*.ts` file as the Pothos field.
   - Use `graphql-context.ts` when request/user context is needed.

6. Confirm the Yoga/Pothos SDL changed correctly:
   - Run root codegen after schema changes.
   - Check `client-app/src/api/generated/schema.graphql`.

## Frontend API Path

7. Add the frontend GraphQL operation:
   - `client-app/src/api/<feature>/operations.ts`
   - Put `graphql(...)` documents under:
     - `// Typed GraphQL documents for this feature's operations.`
   - Put exported request functions under:
     - `// API operations consumed by hooks and other feature callers.`

8. Add or update feature model helpers if needed:
   - `client-app/src/api/<feature>/model.ts`
   - Use this for normalization, derived frontend types, and mappers.

9. Add or update React Query hooks:
   - `client-app/src/api/<feature>/hooks.ts`
   - Queries use `useQuery`.
   - Mutations use `useMutation`.
   - Export query keys from here when other code needs invalidation.

10. Run GraphQL Codegen:
    - `npm run codegen`
    - Updates `client-app/src/api/generated/`.

11. Fix typed hook usage in UI:
    - Components should import from `client-app/src/api/<feature>/hooks.ts`.
    - Components should not import raw operations unless there is a deliberate non-React use case.

12. Invalidate or update React Query cache after mutations:
    - Prefer invalidating the smallest relevant exported query key.
    - Example: `queryClient.invalidateQueries({ queryKey: currentUserQueryKey })`.

13. Test the full path:
    - Backend resolver returns expected data.
    - Generated GraphQL types compile.
    - Hook loading/error/success states behave correctly.
    - Run `npm --workspace client-app run build`.

## Frontend Folder Pattern

```txt
client-app/src/api/
  <feature>/
    operations.ts  # GraphQL documents and raw API calls
    hooks.ts       # React Query hooks and query keys
    model.ts       # optional normalization/types/helpers
  generated/       # GraphQL Codegen output
  graphql/         # shared GraphQL client
```
