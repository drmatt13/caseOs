import { PlusIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
// import React from "react";

const SelectCaseMenu = () => {
  return (
    <>
      <Link to="/cases/new">
        <div className="p-2 ml-1 rounded-lg hover:bg-white/15 cursor-pointer flex items-center gap-1.5 text-xs text-black">
          <PlusIcon className="w-4 h-4" />
          <div>New Case</div>
        </div>
      </Link>
    </>
  );
};

export default SelectCaseMenu;
