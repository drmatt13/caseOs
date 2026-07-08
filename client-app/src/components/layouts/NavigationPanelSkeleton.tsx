// Pulse-skeleton rows for the navigation panel, shared by the full-page
// NavigationPanelLoading skeleton (initial currentUser load) and the live
// NavigationPanel's in-place loading hold during client-side navigation.

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`animate-pulse rounded-lg bg-black/2 ${className}`} />
);

interface NavigationPanelSkeletonRowsProps {
  // The full-page skeleton stands in for the whole panel, so its first row
  // mimics the UserPanel. The live panel keeps the real UserPanel mounted
  // while loading, so it omits that row.
  showUserPanelRow?: boolean;
}

const NavigationPanelSkeletonRows = ({
  showUserPanelRow = false,
}: NavigationPanelSkeletonRowsProps) => (
  <div className="flex flex-col gap-3">
    {showUserPanelRow && <SkeletonBlock className="h-12 w-full" />}
    <SkeletonBlock className="h-9 w-4/5" />
    <SkeletonBlock className="h-9 w-full" />
    <SkeletonBlock className="h-9 w-11/12" />
    <div className="mt-3 flex flex-col gap-2">
      <SkeletonBlock className="h-8 w-full" />
      <SkeletonBlock className="h-8 w-5/6" />
      <SkeletonBlock className="h-8 w-11/12" />
    </div>
    <div className="mt-3 flex flex-col gap-2">
      <SkeletonBlock className="h-8 w-full" />
      <SkeletonBlock className="h-8 w-5/6" />
      <SkeletonBlock className="h-8 w-11/12" />
      <SkeletonBlock className="h-8 w-5/6" />
      <SkeletonBlock className="h-8 w-11/12" />
    </div>
  </div>
);

export default NavigationPanelSkeletonRows;
