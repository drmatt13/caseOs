import { createContext, type Dispatch, type SetStateAction } from "react";

export type Modal =
  | "edit user"
  | "manage subscription"
  | "manage workspaces"
  | "my invitations"
  | "onboard members"
  | null;

export type ModalGuardState = "unlocked" | "state-modified" | "locked";

export interface AppModalContextType {
  modal: Modal;
  setModal: Dispatch<SetStateAction<Modal>>;
  // Workspace the "onboard members" modal acts on. The global modal is rendered
  // outside any workspace route, so the opener stashes the id here.
  modalWorkspaceId: string | null;
  setModalWorkspaceId: Dispatch<SetStateAction<string | null>>;
  modalGuardState: ModalGuardState;
  setModalGuardState: Dispatch<SetStateAction<ModalGuardState>>;
  requestCloseModal: () => boolean;
}

export const AppModalContext = createContext<AppModalContextType>({
  modal: null,
  setModal: () => {},
  modalWorkspaceId: null,
  setModalWorkspaceId: () => {},
  modalGuardState: "unlocked",
  setModalGuardState: () => {},
  requestCloseModal: () => false,
});
