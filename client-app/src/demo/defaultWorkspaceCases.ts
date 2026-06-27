import { caseDisplayName } from "#/lib/caseContext";

import { caseDemos } from "./caseDemos";

export type DefaultWorkspaceCase = {
  id: string;
  name: string;
};

export const defaultWorkspaceCases: DefaultWorkspaceCase[] = caseDemos.map(
  (demo) => ({
    id: demo.caseId,
    name: caseDisplayName(demo.caseContext),
  }),
);
