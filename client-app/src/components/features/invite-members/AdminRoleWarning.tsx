import { TriangleAlert } from "lucide-react";

import type { FieldSize } from "#/components/ui/form";
import { TONES } from "#/lib/tones";

// Inline caution surfaced wherever someone is about to be made an Admin. Admins
// get broad authority — manage members, change roles, remove people, and create
// cases — so we say so before the role is applied. Rendered under the role
// pickers in the invite flows and inside the promote-to-Admin confirm step, so
// the same warning appears everywhere an Admin can be created. Uses the shared
// `caution` tone (amber ink + wash) so it reads as the app's standard warning.
const AdminRoleWarning = ({ size = "md" }: { size?: FieldSize }) => {
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border ${TONES.caution.surface} px-2.5 py-2 ${textSize} ${TONES.caution.ink}`}
    >
      <TriangleAlert className={`mt-0.5 shrink-0 ${iconSize}`} />
      <p>
        Admins can manage members, change roles, remove people, and create cases.
      </p>
    </div>
  );
};

export default AdminRoleWarning;
