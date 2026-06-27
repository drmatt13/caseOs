import CaseWorkspaceModal from "#/components/features/case-workspace/CaseWorkspaceModal";
import type { CaseIntake } from "#/types/caseWorkspace";
import ReviewSectionDetails, {
  REVIEW_SECTION_META,
} from "#/components/features/create-case/ReviewSectionDetails";

// A read-only, top-to-bottom render of the entire intake — the "see everything"
// final read-through. Reuses the workspace modal shell (backdrop blur + tint,
// ESC to close, body-scroll lock) and the same ReviewSectionDetails renderer the
// inline expand uses, so the preview and the inline view can never disagree.
const IntakePreviewModal = ({
  open,
  onClose,
  caseIntake,
}: {
  open: boolean;
  onClose: () => void;
  caseIntake: CaseIntake;
}) => (
  <CaseWorkspaceModal open={open} title="Your intake" onClose={onClose}>
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
      {REVIEW_SECTION_META.map(({ step, title, icon: Icon }) => (
        <section key={step} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-black/10 p-1.5">
              <Icon className="h-4 w-4 text-black/70" />
            </div>
            <h3 className="text-md font-medium text-black">{title}</h3>
          </div>
          <ReviewSectionDetails step={step} caseIntake={caseIntake} />
        </section>
      ))}
      <p className="text-xs text-black/45">
        Generated records start in review, and nothing becomes final until you
        accept it.
      </p>
    </div>
  </CaseWorkspaceModal>
);

export default IntakePreviewModal;
