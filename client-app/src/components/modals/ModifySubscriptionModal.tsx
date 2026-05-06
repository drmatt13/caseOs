import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  XIcon,
} from "lucide-react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import Button from "#/components/Button";
import { getUser } from "#/api/getUser";
import {
  type BillingProduct,
  type BillingTier,
  createSetupIntent,
  createSubscription,
  listBillingProducts,
} from "#/api/billing";
import { AppModalContext } from "#/context/AppModalContext";

type AccountTier = "FREE" | "TRIAL" | "PRO" | "ENTERPRISE";
type SelectableAccountTier = BillingTier;

type TierPrice = {
  amount: number;
  currency: string;
  interval: "month";
  stripePriceId: string | null;
  stripeProductId: string | null;
};

type TierOption = {
  tier: SelectableAccountTier;
  name: string;
  description: string;
  details: string;
  price: TierPrice | null;
  features: string[];
};

type ModalStep = "select-tier" | "payment";
type PaymentStatus = "idle" | "processing" | "success";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

const accountTierLabels: Record<AccountTier, string> = {
  FREE: "Free",
  TRIAL: "Trial",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

const fallbackTierPricing: Record<SelectableAccountTier, TierPrice> = {
  PRO: {
    amount: 200,
    currency: "USD",
    interval: "month",
    stripePriceId: null,
    stripeProductId: null,
  },
  ENTERPRISE: {
    amount: 500,
    currency: "USD",
    interval: "month",
    stripePriceId: null,
    stripeProductId: null,
  },
};

function formatPrice(price: TierPrice | null) {
  if (!price) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(price.amount);
}

function getDefaultSelectedTier(
  currentTier: AccountTier,
): SelectableAccountTier | null {
  if (currentTier === "FREE") return null;
  if (currentTier === "TRIAL") return "PRO";
  if (currentTier === "PRO") return "ENTERPRISE";
  return "PRO";
}

function toTierPricing(products: BillingProduct[] | undefined) {
  const pricing = { ...fallbackTierPricing };

  for (const product of products ?? []) {
    if (product.interval !== "month") continue;

    pricing[product.tier] = {
      amount: product.amount,
      currency: product.currency,
      interval: "month",
      stripePriceId: product.stripePriceId,
      stripeProductId: product.stripeProductId,
    };
  }

  return pricing;
}

function StripePaymentForm({
  selectedOption,
  startTrial,
  setPaymentStatus,
  onBack,
  onSubscribed,
}: {
  selectedOption: TierOption;
  startTrial: boolean;
  setPaymentStatus: (status: PaymentStatus) => void;
  onBack: () => void;
  onSubscribed: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = useCallback(async () => {
    if (!stripe || !elements || !selectedOption.price?.stripePriceId) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setPaymentStatus("processing");

    const setupResult = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: window.location.href,
      },
    });

    if (setupResult.error) {
      setErrorMessage(setupResult.error.message ?? "Payment setup failed.");
      setIsProcessing(false);
      setPaymentStatus("idle");
      return;
    }

    const paymentMethodId = setupResult.setupIntent.payment_method;

    if (typeof paymentMethodId !== "string") {
      setErrorMessage("Stripe did not return a reusable payment method.");
      setIsProcessing(false);
      setPaymentStatus("idle");
      return;
    }

    try {
      await createSubscription({
        tier: selectedOption.tier,
        priceId: selectedOption.price.stripePriceId,
        paymentMethodId,
        startTrial,
      });

      await queryClient.invalidateQueries({ queryKey: ["user"] });
      setPaymentStatus("success");
      setIsProcessing(false);
      onSubscribed();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Subscription failed.",
      );
      setPaymentStatus("idle");
      setIsProcessing(false);
    }
  }, [
    elements,
    onSubscribed,
    queryClient,
    selectedOption.price?.stripePriceId,
    selectedOption.tier,
    setPaymentStatus,
    startTrial,
    stripe,
  ]);

  return (
    <>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white/60 p-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-600" />
            <p className="font-serif text-sm">Payment Details</p>
          </div>

          <div className="mt-3 rounded-lg border border-black/10 bg-white/80 p-3">
            <PaymentElement />
          </div>

          {errorMessage && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-3 rounded-lg border border-black/10 bg-black/[0.03] p-3 text-gray-700">
            Stripe securely collects the card details here and returns only a
            payment method ID to CaseOS.
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-black/[0.03] p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gray-600" />
            <p className="font-serif text-sm">Billing Summary</p>
          </div>

          <div className="mt-3 space-y-2 text-gray-600">
            <div className="flex justify-between gap-3">
              <span>Selected tier</span>
              <span className="font-medium text-black">
                {selectedOption.name}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Due today</span>
              <span className="font-medium text-black">
                {startTrial ? "$0" : formatPrice(selectedOption.price)}
              </span>
            </div>
            {startTrial && (
              <div className="flex justify-between gap-3">
                <span>After trial</span>
                <span className="font-medium text-black">
                  {formatPrice(selectedOption.price)} /mo
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-black/10 bg-white/70 p-2">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
            <p className="leading-5 text-gray-600">
              Payments are secured through Stripe. CaseOS does not keep or store
              any payment information, and subscriptions can be canceled at any
              time.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          text="Back"
          style="secondary"
          onClick={onBack}
          disabled={isProcessing}
        />
        <Button
          text={isProcessing ? "Processing" : "Subscribe"}
          icon="save"
          onClick={handleSubscribe}
          disabled={!stripe || !elements || isProcessing}
          initiallyDisabled
        />
      </div>
    </>
  );
}

const ModifySubscriptionModal = () => {
  const { requestCloseModal, setModalGuardState } =
    useContext(AppModalContext);

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

  const tierOptions = useMemo<TierOption[]>(() => {
    const pricing = toTierPricing(billingProductsResult?.products);

    return [
      {
        tier: "PRO",
        name: "Pro",
        description: "Full subscription for active case work.",
        details:
          "Designed for solo operators and small teams that need dependable access for day-to-day case organization, workspace management, and routine billing without enterprise overhead.",
        price: pricing.PRO,
        features: [
          "Stripe-secured subscription billing",
          "Optional 7 day trial for eligible new subscribers",
          "Standard workspace and case capacity",
        ],
      },
      {
        tier: "ENTERPRISE",
        name: "Enterprise",
        description: "Expanded subscription for larger teams.",
        details:
          "Built for firms and organizations that expect higher usage, broader workspace needs, and priority billing support as their CaseOS footprint grows.",
        price: pricing.ENTERPRISE,
        features: [
          "Stripe-secured subscription billing",
          "Priority billing setup",
          "Expanded usage profile for teams",
        ],
      },
    ];
  }, [billingProductsResult?.products]);

  const selectedOption = tierOptions.find((option) => option.tier === selectedTier);
  const selectedTierLabel = selectedOption?.name ?? "No tier selected";
  const user = userResult?.success ? userResult.data.user : undefined;
  const currentTier = user?.accountTier ?? "FREE";
  const canStartTrial =
    selectedTier === "PRO" && !user?.hasHadActiveSubscription;
  const defaultSelectedTier = getDefaultSelectedTier(currentTier);
  const isUpdatingTier = Boolean(selectedTier && selectedTier !== currentTier);
  const canContinue =
    isUpdatingTier &&
    Boolean(selectedOption?.price?.stripePriceId) &&
    !productsPending;
  const hasStateChanges =
    selectedTier !== defaultSelectedTier ||
    modalStep !== "select-tier" ||
    paymentStatus !== "idle" ||
    startTrial !== false;

  const {
    data: setupIntent,
    isPending: setupIntentPending,
    error: setupIntentError,
  } = useQuery({
    queryKey: ["billing-setup-intent", selectedTier],
    queryFn: createSetupIntent,
    enabled: modalStep === "payment",
    staleTime: 0,
  });

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
    setModalGuardState(
      paymentStatus === "processing"
        ? "locked"
        : hasStateChanges
          ? "state-modified"
          : "unlocked",
    );
  }, [hasStateChanges, paymentStatus, setModalGuardState]);

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

  const openPaymentStep = useCallback(() => {
    if (!canContinue) return;

    setModalStep("payment");
  }, [canContinue]);

  const returnToTierSelection = useCallback(() => {
    setModalStep("select-tier");
    setPaymentStatus("idle");
  }, []);

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

      <div className="mb-3 rounded-lg border border-black/10 bg-black/[0.03] p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-gray-600">
              {modalStep === "select-tier"
                ? "Current subscription"
                : "Selected subscription"}
            </p>
            <p className="mt-1 font-serif text-lg">
              {modalStep === "select-tier"
                ? accountTierLabels[currentTier]
                : selectedTierLabel}
            </p>
          </div>

          <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] text-gray-700">
            {modalStep === "select-tier"
              ? currentTier === "FREE"
                ? "Default tier"
                : "Active tier"
              : `${formatPrice(selectedOption?.price ?? null)}${
                  selectedOption?.price ? " /mo" : ""
                }`}
          </span>
        </div>
      </div>

      {modalStep === "select-tier" && (
        <>
          {productsError && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
              Stripe prices could not be loaded. Check the billing products API
              and Stripe product metadata before subscribing.
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-2">
            {tierOptions.map((option) => {
              const isSelected = selectedTier === option.tier;
              const isCurrentTier = currentTier === option.tier;
              const showTrialOption =
                option.tier === "PRO" && !user.hasHadActiveSubscription;

              return (
                <div
                  key={option.tier}
                  role="button"
                  tabIndex={isCurrentTier ? -1 : 0}
                  onClick={() => {
                    if (isCurrentTier) return;

                    handleTierSelect(option.tier);
                  }}
                  onKeyDown={(event) => {
                    if (isCurrentTier) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleTierSelect(option.tier);
                    }
                  }}
                  className={`flex min-h-64 flex-col rounded-lg border p-3 text-left transition-colors ${
                    isCurrentTier
                      ? "cursor-not-allowed border-black/10 bg-gray-100 text-gray-500"
                      : isSelected
                        ? "border-black/50 bg-black/[0.06]"
                        : "cursor-pointer border-black/10 bg-white/60 hover:border-black/25 hover:bg-black/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-sm">{option.name}</p>
                      <p className="mt-1 text-[11px] leading-4 text-gray-600">
                        {option.description}
                      </p>
                    </div>

                    {isCurrentTier && (
                      <span className="rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-[10px] text-gray-700">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <span className="font-serif text-xl">
                      {productsPending ? "..." : formatPrice(option.price)}
                    </span>
                    {option.price && (
                      <span className="ml-1 text-[11px] text-gray-500">
                        /mo
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-[11px] leading-5 text-gray-600">
                    {option.details}
                  </p>

                  <div className="mt-auto flex flex-col gap-1.5 pt-4">
                    {option.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-1.5">
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                        <span className="text-[11px] leading-4 text-gray-600">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {showTrialOption && (
                    <label
                      onClick={(event) => event.stopPropagation()}
                      className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-black/10 bg-white/70 p-2 text-[11px] text-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={startTrial && selectedTier === "PRO"}
                        onChange={(event) => {
                          setSelectedTier("PRO");
                          setStartTrial(event.currentTarget.checked);
                          setPaymentStatus("idle");
                        }}
                        className="h-3.5 w-3.5 accent-black"
                      />
                      <span>Start with a 7 day trial</span>
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button text="Close" style="secondary" onClick={closeModal} />
            <Button
              text="Continue"
              icon="continue"
              onClick={openPaymentStep}
              disabled={!canContinue}
              initiallyDisabled
            />
          </div>
        </>
      )}

      {modalStep === "payment" && selectedOption && (
        <>
          {setupIntentPending && (
            <div className="mt-4 rounded-lg border border-black/10 bg-white/60 p-4 text-gray-600">
              Initializing Stripe payment details...
            </div>
          )}

          {(setupIntentError || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              Stripe payment details could not be initialized. Verify
              VITE_STRIPE_PUBLISHABLE_KEY and the create SetupIntent Lambda.
            </div>
          )}

          {setupIntent?.clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: setupIntent.clientSecret,
                appearance: {
                  theme: "stripe",
                },
              }}
            >
              <StripePaymentForm
                selectedOption={selectedOption}
                startTrial={startTrial}
                setPaymentStatus={setPaymentStatus}
                onBack={returnToTierSelection}
                onSubscribed={closeModal}
              />
            </Elements>
          )}
        </>
      )}
    </div>
  );
};

export default ModifySubscriptionModal;
