import { useRef } from "react";
import type { CaseIntake } from "#/../../types/caseWorkspace.schema";
import { FormSection } from "#/components/layouts/new_case/fields";
import { Upload, FileText, XIcon, CheckCircle } from "lucide-react";

type DocumentsFormProps = {
  caseIntake: CaseIntake;
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const DocumentsForm = ({
  caseIntake: _caseIntake,
  uploadedFiles,
  setUploadedFiles,
}: DocumentsFormProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles);

    setUploadedFiles((currentFiles) => {
      const existingFileKeys = new Set(
        currentFiles.map(
          (file) => `${file.name}-${file.size}-${file.lastModified}`,
        ),
      );

      const uniqueNewFiles = newFiles.filter((file) => {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        return !existingFileKeys.has(fileKey);
      });

      return [...currentFiles, ...uniqueNewFiles];
    });

    resetFileInput();
  };

  const handleRemoveFile = (fileIndexToRemove: number) => {
    setUploadedFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== fileIndexToRemove),
    );
    resetFileInput();
  };

  const openFilePicker = () => {
    resetFileInput();
    fileInputRef.current?.click();
  };

  return (
    <FormSection
      title="Upload case files"
      description="Documents will be analyzed to extract facts, timeline, and evidence."
      icon="file-text"
    >
      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.json,.md,.txt,.jpeg,.jpg,.png,.gif,.webp,.csv,.xlsx,.xls"
        onChange={handleAddFiles}
      />

      <div
        className="rounded-2xl border-2 border-dashed p-5 text-xs flex flex-col items-center justify-center gap-0.5 text-center py-12 cursor-pointer group border-black/15 hover:border-black/40 hover:bg-mist-300/20 transition-colors"
        onClick={openFilePicker}
      >
        <div className="rounded-full aspect-square p-4 flex justify-center items-center mb-2.5 bg-mist-300/60 group-hover:bg-mist-300 transition-colors">
          <Upload className="w-5 h-5 text-gray-500" />
        </div>

        <p className="font-bold">Drop files here or click to upload</p>
        <p className="text-gray-500">
          Supported formats: PDF, DOCX, JSON, MD, TXT, JPEG, PNG, etc.
        </p>
      </div>

      <div className="text-xs flex flex-col gap-2.5">
        <p>Uploaded files ({uploadedFiles.length})</p>
        {uploadedFiles.map((file, index) => (
          <div
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            className="border border-black/15 w-full flex justify-between items-center rounded-lg p-3"
          >
            <div className="flex gap-2.5">
              <div className="rounded-lg aspect-square p-2 flex justify-center items-center bg-mist-300/60">
                <FileText className="w-4 h-4 text-gray-700" />
              </div>
              <div className="flex flex-col items-start justify-start">
                <p className="font-bold">{file.name}</p>
                <p>{formatFileSize(file.size)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-xs flex gap-1.5 items-center">
                <div>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <button
                  type="button"
                  className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer"
                  onClick={() => handleRemoveFile(index)}
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
};

export default DocumentsForm;
