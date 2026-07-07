import LoadingSpinner from "#/components/ui/LoadingSpinner";

const PageContentLoading = () => {
  return (
    <div className="flex min-h-[calc(100dvh_-_10rem)] items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};

export default PageContentLoading;
