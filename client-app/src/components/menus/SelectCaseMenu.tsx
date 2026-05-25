import { PlusIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface SelectCaseMenuProps {
  cases: {
    id: string;
    name: string;
  }[];
}

const SelectCaseMenu = ({ cases }: SelectCaseMenuProps) => {
  return (
    <>
      <Link to="/cases/new">
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
