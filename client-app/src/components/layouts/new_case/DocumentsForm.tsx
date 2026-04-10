import type { CaseIntake } from "#/../../types/caseWorkspace.schema";
import { FormSection } from "#/components/layouts/new_case/fields";

type DocumentsFormProps = {
  caseIntake: CaseIntake;
};

const DocumentsForm = ({ caseIntake }: DocumentsFormProps) => {
  const documentCount = Object.keys(caseIntake.documents).length;

  return (
    <FormSection
      title="Documents"
      description="This step is reserved for document intake. Upload and document metadata editing can be layered in later without changing the rest of the wizard structure."
      icon="file-text"
    >
      <div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.03] p-5 text-sm leading-6 text-black/70">
        <p>
          Documents are not editable in this pass. The wizard is ready for a
          future upload flow once the storage and submission path is defined.
        </p>
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-black/45">
          Current draft documents: {documentCount}
        </p>
      </div>
    </FormSection>
  );
};

export default DocumentsForm;
