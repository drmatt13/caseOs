import { createContext, type Dispatch, type SetStateAction } from "react";

export type Modal =
  | "edit user"
  | "manage subscription"
  | "manage workspaces"
  | null;

export type ModalGuardState = "unlocked" | "state-modified" | "locked";

export interface AppModalContextType {
  modal: Modal;
  setModal: Dispatch<SetStateAction<Modal>>;
  modalGuardState: ModalGuardState;
  setModalGuardState: Dispatch<SetStateAction<ModalGuardState>>;
  requestCloseModal: () => boolean;
}

export const AppModalContext = createContext<AppModalContextType>({
  modal: null,
  setModal: () => {},
  modalGuardState: "unlocked",
  setModalGuardState: () => {},
  requestCloseModal: () => false,
});
