import { type CSSProperties } from "react";
import ContentShell from "#/components/layouts/ContentShell";
import LoadingSpinner from "#/components/LoadingSpinner";
import useWindowWidthCategory from "#/hooks/useWindowWidthCategory";

const contentShellLoadingHeightStorageKeyPrefix =
  "lawstruct.contentShell.loadingHeight";
const getContentShellLoadingHeightStorageKey = (windowWidthCategory: string) =>
  `${contentShellLoadingHeightStorageKeyPrefix}.${windowWidthCategory}`;

const readContentShellLoadingHeight = (windowWidthCategory: string) => {
  try {
    const storedHeight = window.sessionStorage.getItem(
      getContentShellLoadingHeightStorageKey(windowWidthCategory),
    );
    const parsedHeight = Number(storedHeight);

    return Number.isFinite(parsedHeight) && parsedHeight > 0
      ? parsedHeight
      : null;
  } catch {
    return null;
  }
};

const ContentShellLoading = () => {
  const windowWidthCategory = useWindowWidthCategory();
  const storedLoadingHeight =
    readContentShellLoadingHeight(windowWidthCategory);
  const loadingHeightStyle = {
    height:
      storedLoadingHeight === null
        ? "calc(100dvh - 7rem)"
        : `${storedLoadingHeight}px`,
    maxHeight: "calc(100dvh - 7.15rem)",
  } as CSSProperties;

  return (
    <ContentShell persistLoadingHeight={false}>
      <div
        style={{
          ...loadingHeightStyle,
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex-1 flex justify-center items-center">
          <LoadingSpinner />
        </div>
      </div>
    </ContentShell>
  );
};

export default ContentShellLoading;
