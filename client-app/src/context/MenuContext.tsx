import { createContext, type Dispatch, type SetStateAction } from "react";

interface MenuContextType {
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}

export const MenuContext = createContext<MenuContextType>({
  menuOpen: false,
  setMenuOpen: () => {},
});
