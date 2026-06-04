import AppLayout from "#/components/layouts/AppLayout";
import ContentShell from "#/components/layouts/ContentShell";
import NavigationPanel from "#/components/layouts/NavigationPanel";

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-lg bg-black/5 ${className}`} />
);

const PageLoading = () => {
  return (
    <AppLayout>
      <NavigationPanel>
        <div className="flex flex-col gap-3">
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-9 w-4/5" />
          <SkeletonBlock className="h-9 w-full" />
          <SkeletonBlock className="h-9 w-11/12" />
          <div className="mt-3 flex flex-col gap-2">
            <SkeletonBlock className="h-8 w-full" />
            <SkeletonBlock className="h-8 w-5/6" />
            <SkeletonBlock className="h-8 w-11/12" />
          </div>
        </div>
      </NavigationPanel>
      <ContentShell>
        <div className="flex min-h-[calc(64dvh)] flex-col gap-4">
          <div className="flex flex-col gap-2 border-b border-black/10 pb-4">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-8 w-full max-w-xl" />
            <SkeletonBlock className="h-4 w-full max-w-md" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SkeletonBlock className="h-36 w-full" />
            <SkeletonBlock className="h-36 w-full" />
          </div>
          <SkeletonBlock className="h-56 w-full flex-1" />
        </div>
      </ContentShell>
    </AppLayout>
  );
};

export default PageLoading;
