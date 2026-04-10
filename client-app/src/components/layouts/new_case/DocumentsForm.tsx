import type { CaseIntake } from "#/../../types/caseWorkspace.schema";
import { FormSection } from "#/components/layouts/new_case/fields";
import { Upload } from "lucide-react";

type DocumentsFormProps = {
  caseIntake: CaseIntake;
};

const DocumentsForm = ({ caseIntake }: DocumentsFormProps) => {
  const documentCount = Object.keys(caseIntake.documents).length;

  return (
    <FormSection
      title="Upload case files"
      description="Documents will be analyzed to extract facts, timeline, and evidence."
      icon="file-text"
    >
      <div className="rounded-2xl border-2 border-dashed p-5 text-xs flex flex-col items-center justify-center gap-0.5 text-center py-12 cursor-pointer group border-black/15 hover:border-black/40 hover:bg-mist-300/20 transition-colors">
        <div className="rounded-full aspect-square p-4 flex justify-center items-center mb-2.5 bg-mist-300/60 group-hover:bg-mist-300 transition-colors">
          <Upload className="w-5 h-5 text-gray-500" />
        </div>

        <p className="font-bold">Drop files here or click to upload</p>
        <p className="text-gray-500">Supported formats: PDF, DOCX, TXT</p>
      </div>
    </FormSection>
  );
};

export default DocumentsForm;
