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
  navigationActiveItemKey?: string;
  showHeaderBar?: boolean;
  showWorkspaceSettings?: boolean;
};

export type AuthenticatedLayoutState = {
  navigationContent: ReactNode | null;
  navigationActiveItemKey?: string;
  showHeaderBar: boolean;
  showWorkspaceSettings: boolean;
};

export const defaultAuthenticatedLayoutState: AuthenticatedLayoutState = {
  navigationContent: null,
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
