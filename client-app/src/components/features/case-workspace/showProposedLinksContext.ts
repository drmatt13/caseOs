import { createContext } from "react";

// "Show proposed links" is an inspector view preference, not per-record: once
// turned on it should persist as you open record after record in the inspector
// (each inspected record remounts its own RecordLinksPanel).
export const ShowProposedLinksContext = createContext<{
  show: boolean;
  setShow: (value: boolean) => void;
}>({ show: false, setShow: () => {} });
