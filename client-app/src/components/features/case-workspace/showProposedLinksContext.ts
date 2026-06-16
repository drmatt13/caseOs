import { createContext } from "react";

// Inspector link visibility preferences are not per-record: once changed they
// persist as you open record after record in the inspector (each inspected
// record remounts its own RecordLinksPanel).
export const ShowProposedLinksContext = createContext<{
  show: boolean;
  setShow: (value: boolean) => void;
  showRejected: boolean;
  setShowRejected: (value: boolean) => void;
}>({
  show: false,
  setShow: () => {},
  showRejected: true,
  setShowRejected: () => {},
});
