import { useState } from "react";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";
import LoadingSpinner from "#/components/LoadingSpinner";
import GetUserError from "#/components/errors/GetUserError";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, PlusIcon } from "lucide-react";

// route guards
import { requireAuth } from "#/lib/auth";

import { useCurrentUserQuery } from "#/api/currentUser/hooks";

interface SelectWorkspaceMenuProps {
  workspaces: string[];
}

const SelectWorkspaceMenu = ({ workspaces }: SelectWorkspaceMenuProps) => {
  const {
    data: getUserResult,
    isPending: getUserPending,
    // error: getUserError, // Error is processed in parent component, so we can ignore it here
  } = useCurrentUserQuery();
  const user = getUserResult?.currentUser.user;

  // useGetWorkspacesQuery would go here to fetch workspaces for the user and set them in state
  // For example:
  // const { data: getWorkspacesResult, isPending: getWorkspacesPending, error: getWorkspacesError } = useGetWorkspacesQuery();

  // if (getGetWorkspacesPending) {
  //   return (
  //     <>
  //       <div className="w-full h-52 flex justify-center items-center">
  //         <LoadingSpinner />
  //       </div>
  //     </>
  //   );
  // }

  // return (
  //   <>
  //     <div className="w-full h-40 flex justify-center items-center">
  //       <LoadingSpinner />
  //     </div>
  //   </>
  // );

  return (
    <>
      <div className="text-sm flex pl-1.5 h-6 items-center">
        <p className="truncate underline">Select Workspace</p>
      </div>
      <div className="text-sm h-8 p-2 rounded-lg hover:bg-black/10 cursor-pointer flex items-center gap-1.5 text-black transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
        <PlusIcon className="w-4 h-4" />
        <div>New Workspace</div>
      </div>
      {workspaces.map((workspace) => (
        <Link
          key={workspace}
          to="/workspace/$id"
          params={{ id: "workspace_id" }}
        >
          <div className="text-sm h-8 p-2 rounded-lg hover:bg-black/10 cursor-pointer transition-colors ease-in duration-150 hover:ease-out hover:duration-100">
            <p className="truncate">{workspace}</p>
          </div>
        </Link>
      ))}
    </>
  );
};

export default SelectWorkspaceMenu;
