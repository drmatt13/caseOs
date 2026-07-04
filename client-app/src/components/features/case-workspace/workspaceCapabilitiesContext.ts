import { createContext } from "react";
import {
  DEFAULT_WORKSPACE_CAPABILITIES,
  type WorkspaceCapabilities,
} from "#/lib/permissions";

// The signed-in user's capabilities within the active workspace, provided once
// at the case route and consumed by the record action surfaces so propose /
// accept / answer / task-status controls render only for roles that may use
// them. Default grants nothing — a missing provider must never expose actions.
export const WorkspaceCapabilitiesContext = createContext<WorkspaceCapabilities>(
  DEFAULT_WORKSPACE_CAPABILITIES,
);
