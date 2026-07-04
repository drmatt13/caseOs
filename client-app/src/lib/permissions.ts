// Frontend permission resolution. The actual capability matrix lives in
// @repo/api-contract (workspaceRoles.ts) so the UI gates here and the
// graphql-api resolvers enforce the exact same rules — one security model, no
// drift. Client code should resolve the signed-in user's capabilities once at
// the route boundary, then pass the bag through props/context.
import {
  WORKSPACE_CAPABILITIES,
  hasWorkspaceCapability,
  type WorkspaceCapability,
} from "@repo/api-contract";
import type { MembershipRole } from "#/api/generated/graphql";

export type { WorkspaceCapability };

// A resolved capability bag for a role — convenient to compute once at a route
// boundary and thread into the case-workspace record components.
export type WorkspaceCapabilities = Record<WorkspaceCapability, boolean>;

export function resolveCapabilities(
  role: MembershipRole | null | undefined,
): WorkspaceCapabilities {
  return Object.fromEntries(
    WORKSPACE_CAPABILITIES.map((capability) => [
      capability,
      hasWorkspaceCapability(role, capability),
    ]),
  ) as WorkspaceCapabilities;
}

export const DEFAULT_WORKSPACE_CAPABILITIES = resolveCapabilities(null);
