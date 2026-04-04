import { PlusIcon } from "lucide-react";
import React from "react";

interface SelectCaseMenuProps {
  setOsState: React.Dispatch<
    React.SetStateAction<
      "login" | "select_case" | "create_case" | "case_dashboard"
    >
  >;
}

const SelectCaseMenu = ({ setOsState }: SelectCaseMenuProps) => {
  return (
    <div
      className="p-2 ml-1 rounded-lg hover:bg-white/15 cursor-pointer flex items-center gap-1.5 text-xs text-black"
      onClick={() => setOsState("create_case")}
    >
      <PlusIcon className="w-4 h-4" />
      <div>New Case</div>
    </div>
  );
};

export default SelectCaseMenu;
