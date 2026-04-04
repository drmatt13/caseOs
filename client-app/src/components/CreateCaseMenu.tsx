import React from "react";

import {
  Settings,
  Bot,
  Clock,
  Target,
  SquareCheckBig,
  Folder,
  FileText,
  PlusIcon,
  Briefcase,
  Scale,
  Users,
  FileTextIcon,
} from "lucide-react";

interface CreateCaseMenuProps {
  createCaseState: {
    step: number;
  };
  setCreateCaseState: React.Dispatch<
    React.SetStateAction<{
      step: number;
    }>
  >;
}

const CreateCaseMenu = ({
  createCaseState,
  setCreateCaseState,
}: CreateCaseMenuProps) => {
  return (
    <>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] cursor-pointer font-serif text-[.8rem] ${
          createCaseState.step === 1 ? "/bg-gray-300" : "hover:bg-white/15"
        }`}
        // onClick={() => setWorkSpace("Agent Config")}
      >
        <div className="rounded-full p-2 bg-black">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Case Basics</p>
          <p className="text-gray-700 text-xs">Name, area, role</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] cursor-pointer font-serif text-[.8rem] ${
          createCaseState.step === 2 ? "/bg-gray-300" : "hover:bg-white/15"
        }`}
        // onClick={() => setWorkSpace("Agent Config")}
      >
        <div className="rounded-full p-2 bg-black">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Dispute</p>
          <p className="text-gray-700 text-xs">Claim & status</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] cursor-pointer font-serif text-[.8rem] ${
          createCaseState.step === 3 ? "/bg-gray-300" : "hover:bg-white/15"
        }`}
        // onClick={() => setWorkSpace("Agent Config")}
      >
        <div className="rounded-full p-2 bg-black">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Timeline</p>
          <p className="text-gray-700 text-xs">Key events</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] cursor-pointer font-serif text-[.8rem] ${
          createCaseState.step === 4 ? "/bg-gray-300" : "hover:bg-white/15"
        }`}
        // onClick={() => setWorkSpace("Agent Config")}
      >
        <div className="rounded-full p-2 bg-black">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Goals</p>
          <p className="text-gray-700 text-xs">Objectives & risks</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] cursor-pointer font-serif text-[.8rem] ${
          createCaseState.step === 5 ? "/bg-gray-300" : "hover:bg-white/15"
        }`}
        // onClick={() => setWorkSpace("Agent Config")}
      >
        <div className="rounded-full p-2 bg-black">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Parties & witnesses</p>
          <p className="text-gray-700 text-xs">Involved parties</p>
        </div>
      </div>
      <div
        className={`p-2 rounded-lg flex items-center gap-[.7rem] cursor-pointer font-serif text-[.8rem] ${
          createCaseState.step === 6 ? "/bg-gray-300" : "hover:bg-white/15"
        }`}
        // onClick={() => setWorkSpace("Agent Config")}
      >
        <div className="rounded-full p-2 bg-black">
          <FileTextIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex flex-col">
          <p className="translate-y-[.075rem]">Documents</p>
          <p className="text-gray-700 text-xs">Upload files</p>
        </div>
      </div>
    </>
  );
};

export default CreateCaseMenu;
