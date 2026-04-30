import { createContext } from "react";

export type PopupId = "settings";

interface PopupContextType {
  activePopup: PopupId | null;
  referenceElement: HTMLElement | null;
  openPopup: (popupId: PopupId, element: HTMLElement) => void;
  togglePopup: (popupId: PopupId, element: HTMLElement) => void;
  closePopup: () => void;
}

export const PopupContext = createContext<PopupContextType>({
  activePopup: null,
  referenceElement: null,
  openPopup: () => {},
  togglePopup: () => {},
  closePopup: () => {},
});
