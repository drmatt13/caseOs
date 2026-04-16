import { PlusIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

const SelectCaseMenu = () => {
  return (
    <>
      <Link to="/cases/new">
        <div className="text-xs p-2 rounded-lg hover:bg-mist-300/60 cursor-pointer flex items-center gap-1.5 text-black">
          <PlusIcon className="w-4 h-4" />
          <div>New Case</div>
        </div>
      </Link>
      <Link to="/case/$id" params={{ id: "1" }}>
        <div className="text-xs p-2 rounded-lg hover:bg-mist-300/60 cursor-pointer">
          <p className="truncate">
            Sweeney et al. v. Corcoran Management Co., Inc.
          </p>
        </div>
      </Link>
      <Link to="/case/$id" params={{ id: "2" }}>
        <div className="text-xs p-2 rounded-lg hover:bg-mist-300/60 cursor-pointer">
          <p className="truncate">
            In re: Residential Tenancy Dispute – Unit 71-612-21
          </p>
        </div>
      </Link>
      <Link to="/case/$id" params={{ id: "3" }}>
        <div className="text-xs p-2 rounded-lg hover:bg-mist-300/60 cursor-pointer">
          <p className="truncate">Smith v. Jones – 2023 LT Case No. 12345</p>
        </div>
      </Link>
    </>
  );
};

export default SelectCaseMenu;
