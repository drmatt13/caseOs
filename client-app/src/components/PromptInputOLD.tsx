import { useRef, useState } from "react";
import { PlusIcon, Send, XIcon } from "lucide-react";
import type { CaseSessions } from "#/types/AgentChat";

interface Props {
  caseSessions: CaseSessions;
  setCaseSessions: (conversations: CaseSessions) => void;
  currentCase: string;
  currentConversation: string | undefined;
}

const PromptInput = ({
  caseSessions,
  setCaseSessions,
  currentCase,
  currentConversation,
}: Props) => {
  const [inputValue, setInputValue] = useState("");
  const [rows, setRows] = useState(1);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetState = () => {
    setInputValue("");
    setRows(1);
    setAttachedFiles([]);
    resetFileInput();
  };

  const handleAddFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;

    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const newFiles = Array.from(selectedFiles);

    setAttachedFiles((currentFiles) => {
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
    setAttachedFiles((currentFiles) =>
      currentFiles.filter((_, fileIndex) => fileIndex !== fileIndexToRemove),
    );

    resetFileInput();
  };

  const openFilePicker = () => {
    resetFileInput();
    fileInputRef.current?.click();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setInputValue(text);

    const lineCount = text.split("\n").length;
    setRows(Math.min(Math.max(lineCount, 1), 5));
  };

  return (
    <div className="px-2 py-2 mt-0.5">
      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        multiple
        onChange={handleAddFiles}
      />

      <div
        className={`pt-1.5 px-2 pb-1 w-full bg-white/15 rounded-lg text-sm flex flex-col gap-1`}
      >
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap justify-start gap-1">
            {attachedFiles.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                className="flex items-center gap-0.5 rounded border border-white/30 py-0.5 pl-0.5 pr-1 text-xs text-white/80"
              >
                <button
                  className="rounded p-0.5 hover:bg-white/15"
                  onClick={() => handleRemoveFile(index)}
                  type="button"
                >
                  <XIcon className="h-3 w-3" />
                </button>
                <div>{file.name}</div>
              </div>
            ))}
          </div>
        )}

        <div className={`${attachedFiles.length > 0 ? "pt-1" : "pt-0"} `}>
          <textarea
            className="w-full resize-none border-none bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/50"
            onChange={handleInputChange}
            placeholder="Ask about, update, or analyze your case..."
            rows={rows}
            value={inputValue}
          />
        </div>

        <div className="flex w-full justify-between">
          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-white/15"
            onClick={openFilePicker}
            type="button"
          >
            <PlusIcon className="h-3.5 w-3.5" />
          </button>

          <button
            className="cursor-pointer rounded-lg p-1 hover:bg-white/15"
            onClick={() => {
              const trimmedContent = inputValue.trim();
              if (!trimmedContent) return;
              const timestamp = Date.now();

              resetState();
              // append new message to conversation for the current case and conversation

              if (!currentConversation) return;

              setCaseSessions({
                ...caseSessions,
                [currentCase]: {
                  ...caseSessions[currentCase],
                  [currentConversation]: {
                    ...caseSessions[currentCase]?.[currentConversation],
                    lastUpdatedTimestamp: timestamp,
                    messages: [
                      ...(caseSessions[currentCase]?.[currentConversation]
                        ?.messages ?? []),
                      {
                        timestamp,
                        sender: "user",
                        content: trimmedContent,
                        selection: [],
                        flags: [],
                      },
                    ],
                  },
                },
              });
            }}
            type="button"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
