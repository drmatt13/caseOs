import { createContext, type Dispatch, type SetStateAction } from "react";

export type Modal =
  | "edit user"
  | "manage subscription"
  | "manage workspaces"
  | null;

export interface AppModalContextType {
  modal: Modal;
  setModal: Dispatch<SetStateAction<Modal>>;
}

export const AppModalContext = createContext<AppModalContextType>({
  modal: null,
  setModal: () => {},
});
