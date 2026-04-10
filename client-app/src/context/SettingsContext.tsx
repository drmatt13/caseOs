import { createContext, type Dispatch, type SetStateAction } from "react";

interface SettingsContextType {
  showSettingsModal: boolean;
  setShowSettingsModal: Dispatch<SetStateAction<boolean>>;
}

export const SettingsContext = createContext<SettingsContextType>({
  showSettingsModal: false,
  setShowSettingsModal: () => {},
});
