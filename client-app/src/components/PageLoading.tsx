import AppLayout from "#/components/layouts/AppLayout";
import ContentShell from "#/components/layouts/ContentShell";
import NavigationPanel from "#/components/layouts/NavigationPanel";
import NavigationPanelLoading from "#/components/layouts/NavigationPanelLoading";
import LoadingSpinner from "./LoadingSpinner";

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-lg bg-black/5 ${className}`} />
);

const PageLoading = () => {
  return (
    <AppLayout>
      <NavigationPanelLoading />
      <ContentShell>
        <div className="flex min-h-MIN_HEIGHT flex-col gap-4">
          <div className="flex-1 flex justify-center items-center">
            <LoadingSpinner />
          </div>
        </div>
      </ContentShell>
    </AppLayout>
  );
};

export default PageLoading;
