// Registry of the hardcoded demo cases. The case route resolves one CaseDemo
// bundle by caseId and renders entirely from it, so adding a new demo case is a
// matter of authoring another bundle and listing it here (and adding the case to
// defaultWorkspaceCases so it shows up in the workspace dashboard).

import type { CaseDemo } from "#/demo/caseDemoTypes";
import { faxonCaseDemo } from "#/demo/caseWorkspaceDemo";
import { ojCaseDemo } from "#/demo/caseWorkspaceDemoOj";

export const caseDemos: CaseDemo[] = [faxonCaseDemo, ojCaseDemo];

const caseDemosById = new Map(caseDemos.map((demo) => [demo.caseId, demo]));

// Resolve the demo bundle for a caseId, falling back to the first demo so the
// route always has data to render even for an unknown id.
export function getCaseDemo(caseId: string): CaseDemo {
  return caseDemosById.get(caseId) ?? faxonCaseDemo;
}
