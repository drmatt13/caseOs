import type { CaseIntake } from "#/../../types/caseWorkspace.schema";
import { FormSection } from "#/components/layouts/new_case/fields";
import { Upload, FileText, XIcon, CheckCircle } from "lucide-react";

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
        <p className="text-gray-500">
          Supported formats: PDF, DOCX, JSON, MD, TXT, JPEG, PNG, etc.
        </p>
      </div>
      <div className="text-xs flex flex-col gap-2.5">
        <p>Uploaded files ({documentCount})</p>
        <div className="border border-black/15 w-full flex justify-between items-center rounded-lg p-3">
          <div className="flex gap-2.5">
            <div className="rounded-lg aspect-square p-2 flex justify-center items-center bg-mist-300/60 group-hover:bg-mist-300 transition-colors">
              <FileText className="w-4 h-4 text-gray-700" />
            </div>
            <div className="flex flex-col items-start justify-start">
              <p className="font-bold">FileName.pdf</p>
              <p>Image - xxxxKB</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-xs flex gap-1.5 items-center">
              <div>
                {/* if uploading, p tag with ...uploading, custom spinner to replace later */}
                {/* <p>...uploading</p> */}
                {/* if upload successful, show check icon */}
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer">
                <XIcon className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
        <div className="border border-black/15 w-full flex justify-between items-center rounded-lg p-3">
          <div className="flex gap-2.5">
            <div className="rounded-lg aspect-square p-2 flex justify-center items-center bg-mist-300/60 group-hover:bg-mist-300 transition-colors">
              <FileText className="w-4 h-4 text-gray-700" />
            </div>
            <div className="flex flex-col items-start justify-start">
              <p className="font-bold">FileName.pdf</p>
              <p>Image - xxxxKB</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-xs flex gap-1.5 items-center">
              <div>
                {/* if uploading, p tag with ...uploading, custom spinner to replace later */}
                {/* <p>...uploading</p> */}
                {/* if upload successful, show check icon */}
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer">
                <XIcon className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
};

export default DocumentsForm;
