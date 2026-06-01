import { useState } from "react";
import { ArrowLeft, PlusIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface SelectCaseMenuProps {
  workspace: string;
}

const SelectCaseMenu = ({ workspace }: SelectCaseMenuProps) => {
  const [cases, setCases] = useState<
    {
      id: string;
      name: string;
    }[]
  >([
    {
      id: "case-faxon-commons-demo",
      name: "Faxon Commons v. Sweeney",
    },
    {
      id: "9w8ufw98wsd",
      name: "In re: Residential Tenancy Dispute – Unit 71-612-21",
    },
    { id: "98sufs98euf", name: "Smith v. Jones – 2023 LT Case No. 12345" },
  ]);

  return (
    <>
      <div className="text-sm flex gap-1.5 items-center">
        <Link to="/">
          <button
            type="button"
            className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
        </Link>
        <p className="truncate">{workspace}</p>
      </div>
      <Link to="/create/case/workspace_id">
        <div className="text-sm h-8 p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
          <PlusIcon className="w-4 h-4" />
          <div>New Case</div>
        </div>
      </Link>
      {cases.map((caseItem) => (
        <Link key={caseItem.id} to="/case/$id" params={{ id: caseItem.id }}>
          <div className="text-sm h-8 p-2 rounded-lg hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <p className="truncate">{caseItem.name}</p>
          </div>
        </Link>
      ))}
    </>
  );
};

export default SelectCaseMenu;
