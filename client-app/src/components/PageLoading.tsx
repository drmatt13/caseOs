import AppLayout from "#/components/layouts/AppLayout";
import ContentShellLoading from "#/components/layouts/ContentShellLoading";
import NavigationPanelLoading from "#/components/layouts/NavigationPanelLoading";

const PageLoading = () => {
  return (
    <AppLayout>
      <NavigationPanelLoading />
      <ContentShellLoading />
    </AppLayout>
  );
};

export default PageLoading;
