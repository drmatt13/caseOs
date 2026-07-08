import {
  createContext,
  useContext,
  useLayoutEffect,
  type DependencyList,
  type ReactNode,
} from "react";
import type { CurrentUser } from "#/api/currentUser/model";

export type AuthenticatedLayoutOptions = {
  navigationContent?: ReactNode;
  // True while the route's navigation content is still loading (e.g. its query
  // is pending), so the persistent NavigationPanel can hold its previous height
  // and show a skeleton instead of collapsing. Explicit on purpose: a null
  // navigationContent can be a deliberate "no menu" state (e.g. /workspaces/new
  // for FREE tier), so loading must never be inferred from null content.
  navigationLoading?: boolean;
  navigationActiveItemKey?: string;
  showHeaderBar?: boolean;
  showWorkspaceSettings?: boolean;
};

export type AuthenticatedLayoutState = {
  navigationContent: ReactNode | null;
  navigationLoading: boolean;
  navigationActiveItemKey?: string;
  showHeaderBar: boolean;
  showWorkspaceSettings: boolean;
};

export const defaultAuthenticatedLayoutState: AuthenticatedLayoutState = {
  navigationContent: null,
  navigationLoading: false,
  navigationActiveItemKey: undefined,
  showHeaderBar: true,
  showWorkspaceSettings: false,
};

type AuthenticatedLayoutContextValue = {
  user: CurrentUser;
  setLayoutOptions: (options: AuthenticatedLayoutOptions) => void;
  resetLayoutOptions: () => void;
};

const AuthenticatedLayoutContext =
  createContext<AuthenticatedLayoutContextValue | null>(null);

export const AuthenticatedLayoutProvider =
  AuthenticatedLayoutContext.Provider;

export function useAuthenticatedLayout() {
  const context = useContext(AuthenticatedLayoutContext);

  if (!context) {
    throw new Error(
      "useAuthenticatedLayout must be used inside AuthenticatedLayoutProvider.",
    );
  }

  return context;
}

export function useAuthenticatedLayoutEffect(
  createOptions: () => AuthenticatedLayoutOptions,
  deps: DependencyList,
) {
  const { setLayoutOptions, resetLayoutOptions } = useAuthenticatedLayout();

  // Layout options must land before paint so the shell doesn't flash the
  // previous route's menu during client-side navigation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    setLayoutOptions(createOptions());
    return resetLayoutOptions;
  }, [setLayoutOptions, resetLayoutOptions, ...deps]);
}
