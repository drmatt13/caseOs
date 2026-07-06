import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, XIcon } from "lucide-react";
import { isSelfServeTier } from "@repo/billing-catalog";

import Button from "#/components/ui/Button";
import { BLANK_SURFACE, TONES } from "#/lib/tones";
import { useCurrentUserQuery } from "#/api/currentUser/hooks";
import { useBillingProductsQuery } from "#/api/billing/hooks";
import type {
  BillingProductInterval,
  PlanChangePreview,
} from "#/api/billing/operations";
import { AppModalContext } from "#/context/AppModalContext";
import PaymentStep from "#/components/modals/modify-subscription/PaymentStep";
import SelectTierStep from "#/components/modals/modify-subscription/SelectTierStep";
import SwitchPlanStep from "#/components/modals/modify-subscription/SwitchPlanStep";
import {
  accountTierLabels,
  buildTierCards,
  formatBillingDate,
  formatCurrency,
  type LivePrice,
  type ModalStep,
  type PaymentStatus,
  type PlanSelection,
  type PriceView,
  type TierCard,
} from "#/components/modals/modify-subscription/types";

const stepOrder: Record<ModalStep, number> = {
  "select-tier": 0,
  "switch-confirm": 1,
  payment: 2,
};

const ModifySubscriptionModal = () => {
  const { requestCloseModal, setModalGuardState } = useContext(AppModalContext);

  const [modalStep, setModalStep] = useState<ModalStep>("select-tier");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [billingInterval, setBillingInterval] =
    useState<BillingProductInterval>("month");
  const [selection, setSelection] = useState<PlanSelection | null>(null);
  const [switchPreview, setSwitchPreview] =
    useState<PlanChangePreview | null>(null);

  const stepDirectionRef = useRef<"forward" | "back" | null>(null);
  const stepContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    data: userResult,
    isPending: userPending,
    error: userError,
  } = useCurrentUserQuery();

  const {
    data: billingProductsResult,
    isPending: productsPending,
    error: productsError,
  } = useBillingProductsQuery();

  const cards = useMemo(
    () => buildTierCards(billingProductsResult?.products),
    [billingProductsResult?.products],
  );

  const user = userResult?.currentUser.user;
  const currentTier = user?.accountTier ?? "FREE";
  const hasHadActiveSubscription = user?.hasHadActiveSubscription ?? false;
  const subscriptionStatus = user?.subscriptionStatus ?? "INACTIVE";
  const hasActiveSubscription =
    subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING";
  const trialEligible = !hasHadActiveSubscription && !hasActiveSubscription;
  const currentPriceId = user?.stripePriceId ?? null;

  // Compact "Current plan: Pro · $299/mo · renews Jul 12, 2026" header line.
  const currentPlanSummary = useMemo(() => {
    const parts: { text: string; tone?: "caution" }[] = [];

    const liveCurrentPrice = billingProductsResult?.products.find(
      (product) => product.stripePriceId === currentPriceId,
    );

    if (liveCurrentPrice) {
      parts.push({
        text: `${formatCurrency(
          liveCurrentPrice.amount,
          liveCurrentPrice.currency,
        )}${liveCurrentPrice.interval === "year" ? "/yr" : "/mo"}`,
      });
    }

    if (user?.cancelAtPeriodEnd) {
      const cancelDate = formatBillingDate(user?.currentPeriodEnd);
      parts.push({
        text: cancelDate ? `cancels ${cancelDate}` : "cancels at period end",
        tone: "caution",
      });
    } else if (subscriptionStatus === "TRIALING") {
      const trialEnd = formatBillingDate(user?.trialEndsAt);
      if (trialEnd) parts.push({ text: `trial ends ${trialEnd}` });
    } else if (hasActiveSubscription) {
      const renewDate = formatBillingDate(user?.currentPeriodEnd);
      if (renewDate) parts.push({ text: `renews ${renewDate}` });
    }

    return parts;
  }, [
    billingProductsResult?.products,
    currentPriceId,
    hasActiveSubscription,
    subscriptionStatus,
    user?.cancelAtPeriodEnd,
    user?.currentPeriodEnd,
    user?.trialEndsAt,
  ]);

  useEffect(() => {
    setBillingInterval(user?.billingInterval === "YEAR" ? "year" : "month");
    setModalStep("select-tier");
    setPaymentStatus("idle");
    setSelection(null);
    setSwitchPreview(null);
    setModalGuardState("unlocked");
  }, [user?.billingInterval, setModalGuardState]);

  useEffect(() => {
    if (modalStep === "select-tier") {
      setModalGuardState("unlocked");
      return;
    }

    if (paymentStatus === "processing") {
      setModalGuardState("locked");
      return;
    }

    setModalGuardState(
      paymentStatus === "success" ? "unlocked" : "state-modified",
    );
  }, [modalStep, paymentStatus, setModalGuardState]);

  useEffect(() => {
    return () => {
      setModalGuardState("unlocked");
    };
  }, [setModalGuardState]);

  // Move focus to the top of each newly shown step (login view idiom); null
  // direction means initial render, where focus must stay untouched.
  useEffect(() => {
    if (stepDirectionRef.current === null) return;
    stepContainerRef.current?.focus({ preventScroll: true });
  }, [modalStep, paymentStatus]);

  const goToStep = useCallback(
    (next: ModalStep) => {
      stepDirectionRef.current =
        stepOrder[next] > stepOrder[modalStep] ? "forward" : "back";
      setModalStep(next);
    },
    [modalStep],
  );

  const closeModal = useCallback(() => {
    requestCloseModal();
  }, [requestCloseModal]);

  const handleSelectPrice = useCallback(
    (
      card: TierCard,
      price: PriceView & { live: LivePrice },
      startTrial: boolean,
    ) => {
      if (!isSelfServeTier(card.tier)) return;

      setSelection({
        tier: card.tier,
        tierLabel: card.label,
        price,
        startTrial,
        trialDays: card.trialDays,
      });
      setSwitchPreview(null);
      setPaymentStatus("idle");
      goToStep(hasActiveSubscription ? "switch-confirm" : "payment");
    },
    [goToStep, hasActiveSubscription],
  );

  const handleUseDifferentCard = useCallback(
    (preview: PlanChangePreview | null) => {
      setSwitchPreview(preview);
      goToStep("payment");
    },
    [goToStep],
  );

  const returnToTierSelection = useCallback(() => {
    setPaymentStatus("idle");
    goToStep("select-tier");
  }, [goToStep]);

  const handleBackFromPayment = useCallback(() => {
    setPaymentStatus("idle");

    // Returning to switch-confirm is only safe when a card is on file;
    // otherwise it would immediately bounce back to the payment step.
    if (hasActiveSubscription && selection && switchPreview?.paymentMethod) {
      goToStep("switch-confirm");
      return;
    }

    goToStep("select-tier");
  }, [goToStep, hasActiveSubscription, selection, switchPreview]);

  const renderModalStep = () => {
    if (paymentStatus === "success" && selection) {
      return (
        <div className={`mt-4 rounded-2xl border p-4 ${BLANK_SURFACE}`}>
          <div className="flex items-start gap-3">
            <CheckCircle2
              className={`mt-0.5 h-4 w-4 shrink-0 ${TONES.positive.ink}`}
            />
            <div>
              <p className="font-serif text-lg">
                {selection.startTrial
                  ? "Trial started"
                  : "Subscription confirmed"}
              </p>
              <p className="mt-1 max-w-xl text-md leading-6 text-black/70">
                {selection.startTrial
                  ? `Your ${selection.trialDays ?? 7}-day ${selection.tierLabel} trial is underway. `
                  : `Your ${selection.tierLabel} subscription is active. `}
                You can now create workspaces, invite collaborators, and
                organize shared case work from the workspace menu.
              </p>
              <div className="mt-4">
                <Button
                  text="Continue"
                  icon="briefcase"
                  onClick={closeModal}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (modalStep === "select-tier") {
      return (
        <SelectTierStep
          cards={cards}
          interval={billingInterval}
          currentTier={currentTier}
          currentPriceId={currentPriceId}
          hasActiveSubscription={hasActiveSubscription}
          trialEligible={trialEligible}
          pricesLoading={productsPending}
          productsError={productsError}
          onIntervalChange={setBillingInterval}
          onSelect={handleSelectPrice}
          onClose={closeModal}
        />
      );
    }

    if (!selection) return null;

    if (modalStep === "switch-confirm") {
      return (
        <SwitchPlanStep
          selection={selection}
          currentTierLabel={accountTierLabels[currentTier]}
          onPaymentStatusChange={setPaymentStatus}
          onBack={returnToTierSelection}
          onUseDifferentCard={handleUseDifferentCard}
        />
      );
    }

    if (modalStep === "payment") {
      return (
        <PaymentStep
          selection={selection}
          switchPreview={switchPreview}
          onPaymentStatusChange={setPaymentStatus}
          onBack={handleBackFromPayment}
        />
      );
    }

    return null;
  };

  if (userPending) {
    return (
      <div className="w-5xl max-w-[calc(100vw-3rem)] p-2 text-sm">
        <div className="h-4 w-40 rounded bg-black/10" />
        <div className="mt-2 h-3 w-72 rounded bg-black/10" />
        <div className="mt-4 flex justify-end">
          <div className="h-7 w-44 rounded-lg bg-black/10" />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="h-72 rounded-2xl bg-black/10" />
          <div className="h-72 rounded-2xl bg-black/10" />
          <div className="h-72 rounded-2xl bg-black/10" />
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="w-lg max-w-[calc(100vw-3rem)] p-2 text-sm">
        <p className="font-serif text-lg">Manage Subscription</p>
        <p className="mt-2 text-black/65">
          Could not load your current subscription.
        </p>
      </div>
    );
  }

  const stepSubtitle =
    modalStep === "select-tier"
      ? "Choose the plan that fits how you work. Switch or cancel at any time."
      : modalStep === "switch-confirm"
        ? "Review the prorated change before it is applied."
        : "Confirm the selected subscription and payment method.";

  const viewAnimationClass =
    stepDirectionRef.current === null
      ? "outline-none"
      : `outline-none motion-reduce:animate-none ${
          stepDirectionRef.current === "forward"
            ? "animate-view-forward"
            : "animate-view-back"
        }`;

  return (
    <div className="w-5xl max-w-[calc(100vw-3rem)] p-1 text-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-lg">Manage Subscription</p>
          <p className="mt-0.5 text-black/60">{stepSubtitle}</p>
          <p className="mt-1.5 text-xs text-black/60">
            Current plan:{" "}
            <span className="font-medium text-black/80">
              {accountTierLabels[currentTier]}
            </span>
            {currentPlanSummary.map((part) => (
              <span key={part.text}>
                {" · "}
                <span
                  className={
                    part.tone === "caution" ? TONES.caution.ink : undefined
                  }
                >
                  {part.text}
                </span>
              </span>
            ))}
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

      <div
        key={paymentStatus === "success" ? "success" : modalStep}
        ref={stepContainerRef}
        tabIndex={-1}
        className={viewAnimationClass}
      >
        {renderModalStep()}
      </div>
    </div>
  );
};

export default ModifySubscriptionModal;
