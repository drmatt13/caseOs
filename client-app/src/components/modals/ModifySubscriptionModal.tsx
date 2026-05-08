import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";

import { getUser } from "#/api/getUser";
import { listBillingProducts } from "#/api/billing";
import { AppModalContext } from "#/context/AppModalContext";
import PaymentStep from "#/components/modals/modify-subscription/PaymentStep";
import SelectTierStep from "#/components/modals/modify-subscription/SelectTierStep";
import SubscriptionSnapshot from "#/components/modals/modify-subscription/SubscriptionSnapshot";
import {
  buildTierOptions,
  getDefaultSelectedTier,
  type AccountTier,
  type ModalStep,
  type PaymentStatus,
  type SelectableAccountTier,
} from "#/components/modals/modify-subscription/types";

const ModifySubscriptionModal = () => {
  const { requestCloseModal, setModalGuardState } = useContext(AppModalContext);

  const [selectedTier, setSelectedTier] =
    useState<SelectableAccountTier | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>("select-tier");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [startTrial, setStartTrial] = useState(false);

  const {
    data: userResult,
    isPending: userPending,
    error: userError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const {
    data: billingProductsResult,
    isPending: productsPending,
    error: productsError,
  } = useQuery({
    queryKey: ["billing-products"],
    queryFn: listBillingProducts,
  });

  const tierOptions = useMemo(
    () => buildTierOptions(billingProductsResult?.products),
    [billingProductsResult?.products],
  );

  const selectedOption = tierOptions.find(
    (option) => option.tier === selectedTier,
  );
  const selectedTierLabel = selectedOption?.name ?? "No tier selected";
  const selectedPrice = selectedOption?.price ?? null;
  const user = userResult?.success ? userResult.data.user : undefined;
  const hasHadActiveSubscription = user?.hasHadActiveSubscription ?? false;
  const currentTier: AccountTier = user?.accountTier ?? "FREE";
  const canStartTrial = selectedTier === "PRO" && !hasHadActiveSubscription;
  const defaultSelectedTier = getDefaultSelectedTier(currentTier);
  const isUpdatingTier = Boolean(selectedTier && selectedTier !== currentTier);
  const canContinue =
    isUpdatingTier && Boolean(selectedPrice?.stripePriceId) && !productsPending;
  useEffect(() => {
    setSelectedTier(defaultSelectedTier);
    setModalStep("select-tier");
    setPaymentStatus("idle");
    setStartTrial(false);
    setModalGuardState("unlocked");
  }, [defaultSelectedTier, setModalGuardState]);

  useEffect(() => {
    if (!canStartTrial) {
      setStartTrial(false);
    }
  }, [canStartTrial]);

  useEffect(() => {
    if (modalStep === "select-tier") {
      setModalGuardState("unlocked");
      return;
    }

    setModalGuardState(
      paymentStatus === "processing" ? "locked" : "state-modified",
    );
  }, [modalStep, paymentStatus, setModalGuardState]);

  useEffect(() => {
    return () => {
      setModalGuardState("unlocked");
    };
  }, [setModalGuardState]);

  const closeModal = useCallback(() => {
    requestCloseModal();
  }, [requestCloseModal]);

  const handleTierSelect = useCallback((tier: SelectableAccountTier) => {
    setSelectedTier(tier);
    setModalStep("select-tier");
    setPaymentStatus("idle");
  }, []);

  const handleStartTrialChange = useCallback((shouldStartTrial: boolean) => {
    setStartTrial(shouldStartTrial);
    setPaymentStatus("idle");
  }, []);

  const openPaymentStep = useCallback(() => {
    if (!canContinue) return;

    setModalStep("payment");
  }, [canContinue]);

  const returnToTierSelection = useCallback(() => {
    setModalStep("select-tier");
    setPaymentStatus("idle");
  }, []);

  const renderModalStep = () => {
    if (modalStep === "select-tier") {
      return (
        <SelectTierStep
          tierOptions={tierOptions}
          selectedTier={selectedTier}
          currentTier={currentTier}
          hasHadActiveSubscription={hasHadActiveSubscription}
          productsPending={productsPending}
          productsError={productsError}
          startTrial={startTrial}
          canContinue={canContinue}
          onTierSelect={handleTierSelect}
          onStartTrialChange={handleStartTrialChange}
          onClose={closeModal}
          onContinue={openPaymentStep}
        />
      );
    }

    if (!selectedOption) return null;

    if (modalStep === "payment") {
      return (
        <PaymentStep
          selectedOption={selectedOption}
          startTrial={startTrial}
          onPaymentStatusChange={setPaymentStatus}
          onBack={returnToTierSelection}
          onSubscribed={closeModal}
        />
      );
    }

    return null;
  };

  if (userPending) {
    return (
      <div className="w-3xl max-w-[calc(100vw-3rem)] p-2 text-xs">
        <div className="h-4 w-36 rounded bg-black/10" />
        <div className="mt-4 h-16 rounded-lg bg-black/10" />
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="h-40 rounded-lg bg-black/10" />
          <div className="h-40 rounded-lg bg-black/10" />
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="w-lg max-w-[calc(100vw-3rem)] p-2 text-xs">
        <p className="font-serif text-base">Manage Subscription</p>
        <p className="mt-2 text-gray-600">
          Could not load your current subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="w-3xl max-w-[calc(100vw-3rem)] p-1 text-xs">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-base">Manage Subscription</p>
          <p className="mt-0.5 text-gray-600">
            {modalStep === "select-tier"
              ? "Review your current subscription and choose a new account tier."
              : "Confirm the selected subscription and payment method."}
          </p>
        </div>

        <button
          type="button"
          aria-label="Close modal"
          onClick={closeModal}
          className="cursor-pointer rounded-lg p-1.5 transition-colors duration-150 ease-in hover:bg-black/15 hover:duration-100 hover:ease-out"
        >
          <XIcon className="h-5 w-5 text-black" />
        </button>
      </div>

      <SubscriptionSnapshot
        modalStep={modalStep}
        currentTier={currentTier}
        selectedTierLabel={selectedTierLabel}
        selectedPrice={selectedPrice}
      />

      {renderModalStep()}
    </div>
  );
};

export default ModifySubscriptionModal;
