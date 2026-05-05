import {
  type ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CreditCard,
  LockKeyhole,
  Plus,
  ShieldCheck,
  XIcon,
} from "lucide-react";

import Button from "#/components/Button";
import { getUser } from "#/api/getUser";
import { AppModalContext } from "#/context/AppModalContext";

type AccountTier = "FREE" | "TRIAL" | "PRO" | "ENTERPRISE";
type SelectableAccountTier = Exclude<AccountTier, "FREE">;

type TierPrice = {
  amount: number;
  currency: "USD";
  interval: "month";
};

type TierOption = {
  tier: SelectableAccountTier;
  name: string;
  description: string;
  details: string;
  price: TierPrice | null;
  badge?: string;
  features: string[];
};

type ModalStep = "select-tier" | "payment";
type MockPaymentMode = "saved-card" | "new-card";
type MockPaymentStatus = "idle" | "processing" | "success";
type MockPaymentMethodId =
  | "pm_mock_visa_4242"
  | "pm_mock_mastercard_4444";

const inputClass =
  "rounded-lg border border-black/15 bg-white/70 px-2 py-2 outline-none transition-colors focus:border-black/40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";

const mockSavedPaymentMethods = [
  {
    id: "pm_mock_visa_4242",
    brand: "Visa",
    label: "Visa ending in 4242",
    expires: "04/29",
  },
  {
    id: "pm_mock_mastercard_4444",
    brand: "Mastercard",
    label: "Mastercard ending in 4444",
    expires: "11/28",
  },
] as const;

const accountTierLabels: Record<AccountTier, string> = {
  FREE: "Free",
  TRIAL: "Trial",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

const getTierPricing = async (): Promise<Record<AccountTier, TierPrice | null>> => {
  return {
    FREE: null,
    TRIAL: null,
    PRO: { amount: 200, currency: "USD", interval: "month" },
    ENTERPRISE: { amount: 500, currency: "USD", interval: "month" },
  };
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

const ModifySubscriptionModal = () => {
  const { requestCloseModal, setModalGuardState } =
    useContext(AppModalContext);

  const [selectedTier, setSelectedTier] =
    useState<SelectableAccountTier | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>("select-tier");
  const [mockPaymentMode, setMockPaymentMode] =
    useState<MockPaymentMode>("saved-card");
  const [selectedMockPaymentMethodId, setSelectedMockPaymentMethodId] =
    useState<MockPaymentMethodId>(mockSavedPaymentMethods[0].id);
  const [mockPaymentStatus, setMockPaymentStatus] =
    useState<MockPaymentStatus>("idle");
  const [promoCode, setPromoCode] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [mockCardNumber, setMockCardNumber] = useState("");
  const [mockCardExpiry, setMockCardExpiry] = useState("");
  const [mockCardCvc, setMockCardCvc] = useState("");

  const {
    data: userResult,
    isPending: userPending,
    error: userError,
  } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });

  const { data: tierPricing, isPending } = useQuery({
    queryKey: ["stripe-tier-pricing"],
    queryFn: getTierPricing,
  });

  const tierOptions = useMemo<TierOption[]>(() => {
    const pricing = tierPricing ?? {
      FREE: null,
      TRIAL: null,
      PRO: { amount: 200, currency: "USD", interval: "month" },
      ENTERPRISE: { amount: 500, currency: "USD", interval: "month" },
    };

    return [
      {
        tier: "TRIAL",
        name: "Trial",
        description: "Promotional access with payment on file.",
        details:
          "Best for evaluating the full workflow with a verified promo code before committing to a paid monthly subscription.",
        price: pricing.TRIAL,
        badge: "Promo",
        features: [
          "6 digit promo code",
          "Payment method required",
          "Moves through the same secure billing path",
        ],
      },
      {
        tier: "PRO",
        name: "Pro",
        description: "Full subscription for active case work.",
        details:
          "Designed for solo operators and small teams that need dependable access for day-to-day case organization.",
        price: pricing.PRO,
        features: [
          "Stripe-secured payment",
          "Cancel any time",
          "Standard workspace and case capacity",
        ],
      },
      {
        tier: "ENTERPRISE",
        name: "Enterprise",
        description: "Expanded subscription for larger teams.",
        details:
          "Built for firms and organizations that expect higher usage, broader workspace needs, and priority billing support.",
        price: pricing.ENTERPRISE,
        features: [
          "Stripe-secured payment",
          "Priority billing setup",
          "Expanded usage profile for teams",
        ],
      },
    ];
  }, [tierPricing]);

  const selectedOption = tierOptions.find((option) => option.tier === selectedTier);
  const selectedTierLabel = selectedOption?.name ?? "No tier selected";
  const requiresPromoCode = selectedTier === "TRIAL";
  const requiresPayment = true;
  const normalizedPromoCode = promoCode.trim();
  const promoCodeIsValid = /^\d{6}$/.test(normalizedPromoCode);
  const user = userResult?.success ? userResult.data.user : undefined;
  const currentTier = user?.accountTier ?? "FREE";
  const defaultSelectedTier = getDefaultSelectedTier(currentTier);
  const isUpdatingTier = Boolean(selectedTier && selectedTier !== currentTier);
  const hasNewCardDetails = Boolean(
    cardholderName.trim() &&
      billingEmail.trim() &&
      mockCardNumber.trim() &&
      mockCardExpiry.trim() &&
      mockCardCvc.trim(),
  );
  const hasSavedCardDetails = Boolean(selectedMockPaymentMethodId);
  const hasPaymentDetails =
    mockPaymentMode === "saved-card" ? hasSavedCardDetails : hasNewCardDetails;
  const canSubmitMockPayment =
    isUpdatingTier &&
    (requiresPromoCode ? promoCodeIsValid : true) &&
    hasPaymentDetails &&
    mockPaymentStatus !== "processing";
  const hasStateChanges =
    selectedTier !== defaultSelectedTier ||
    modalStep !== "select-tier" ||
    mockPaymentMode !== "saved-card" ||
    selectedMockPaymentMethodId !== mockSavedPaymentMethods[0].id ||
    mockPaymentStatus !== "idle" ||
    promoCode !== "" ||
    cardholderName !== "" ||
    billingEmail !== "" ||
    mockCardNumber !== "" ||
    mockCardExpiry !== "" ||
    mockCardCvc !== "";

  useEffect(() => {
    setSelectedTier(defaultSelectedTier);
    setModalStep("select-tier");
    setMockPaymentMode("saved-card");
    setSelectedMockPaymentMethodId(mockSavedPaymentMethods[0].id);
    setMockPaymentStatus("idle");
    setPromoCode("");
    setCardholderName("");
    setBillingEmail("");
    setMockCardNumber("");
    setMockCardExpiry("");
    setMockCardCvc("");
    setModalGuardState("unlocked");
  }, [defaultSelectedTier, setModalGuardState]);

  useEffect(() => {
    setModalGuardState(
      mockPaymentStatus === "processing"
        ? "locked"
        : hasStateChanges
          ? "state-modified"
          : "unlocked",
    );
  }, [hasStateChanges, mockPaymentStatus, setModalGuardState]);

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
    setMockPaymentStatus("idle");
  }, []);

  const handlePromoCodeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value.replace(/\D/g, "").slice(0, 6);
      setPromoCode(nextValue);
    },
    [],
  );

  const handleCardholderNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setCardholderName(event.target.value);
    },
    [],
  );

  const handleBillingEmailChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setBillingEmail(event.target.value);
    },
    [],
  );

  const handleMockCardNumberChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 ");
      setMockCardNumber(nextValue);
    },
    [],
  );

  const handleMockCardExpiryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
      const nextValue =
        digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
      setMockCardExpiry(nextValue);
    },
    [],
  );

  const handleMockCardCvcChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMockCardCvc(event.target.value.replace(/\D/g, "").slice(0, 4));
    },
    [],
  );

  const openPaymentStep = useCallback(() => {
    if (!selectedTier || !isUpdatingTier) return;

    setModalStep("payment");
  }, [isUpdatingTier, selectedTier]);

  const returnToTierSelection = useCallback(() => {
    setModalStep("select-tier");
    setMockPaymentStatus("idle");
  }, []);

  const handleMockPayment = useCallback(() => {
    if (!canSubmitMockPayment) return;

    setMockPaymentStatus("processing");

    window.setTimeout(() => {
      setMockPaymentStatus("success");
    }, 900);

    console.info("Subscription selection boilerplate", {
      selectedTier,
      promoCode: requiresPromoCode ? normalizedPromoCode : undefined,
      requiresPayment,
      paymentMode: mockPaymentMode,
      paymentMethodId:
        mockPaymentMode === "saved-card"
          ? selectedMockPaymentMethodId
          : "pm_mock_new_card",
    });
  }, [
    canSubmitMockPayment,
    mockPaymentMode,
    normalizedPromoCode,
    requiresPayment,
    requiresPromoCode,
    selectedMockPaymentMethodId,
    selectedTier,
  ]);

  if (userPending) {
    return (
      <div className="w-3xl max-w-[calc(100vw-3rem)] p-2 text-xs">
        <div className="h-4 w-36 rounded bg-black/10" />
        <div className="mt-4 h-16 rounded-lg bg-black/10" />
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="h-40 rounded-lg bg-black/10" />
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
        <div className="grid gap-2 md:grid-cols-3">
          {tierOptions.map((option) => {
            const isSelected = selectedTier === option.tier;
            const isCurrentTier = currentTier === option.tier;

            return (
              <button
                key={option.tier}
                type="button"
                disabled={isCurrentTier}
                onClick={() => handleTierSelect(option.tier)}
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

                  {(option.badge || isCurrentTier) && (
                    <span className="rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-[10px] text-gray-700">
                      {isCurrentTier ? "Current" : option.badge}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="font-serif text-xl">
                    {isPending ? "..." : formatPrice(option.price)}
                  </span>
                  {option.price && (
                    <span className="ml-1 text-[11px] text-gray-500">/mo</span>
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
              </button>
            );
          })}
        </div>
      )}

      {modalStep === "payment" && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-black/10 bg-white/60 p-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <p className="font-serif text-sm">Payment Details</p>
            </div>

            {requiresPromoCode && (
              <label className="mt-3 flex flex-col gap-1">
                <span className="text-gray-600">Promo code</span>
                <input
                  value={promoCode}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  onChange={handlePromoCodeChange}
                  className={`${inputClass} font-mono tracking-[0.35em]`}
                />
                <span className="text-[11px] text-gray-500">
                  Enter a 6 digit promo code to activate the trial tier.
                </span>
              </label>
            )}

            <div className="mt-3 grid gap-2">
              <div className="grid gap-2 md:grid-cols-2">
                {mockSavedPaymentMethods.map((paymentMethod) => {
                  const isSelectedPaymentMethod =
                    mockPaymentMode === "saved-card" &&
                    selectedMockPaymentMethodId === paymentMethod.id;

                  return (
                    <button
                      key={paymentMethod.id}
                      type="button"
                      onClick={() => {
                        setMockPaymentMode("saved-card");
                        setSelectedMockPaymentMethodId(paymentMethod.id);
                        setMockPaymentStatus("idle");
                      }}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        isSelectedPaymentMethod
                          ? "border-black/50 bg-black/[0.06]"
                          : "border-black/10 bg-white/70 hover:border-black/25 hover:bg-black/[0.03]"
                      }`}
                    >
                      <p className="font-medium text-black">
                        {paymentMethod.label}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {paymentMethod.brand} · Expires {paymentMethod.expires}
                      </p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setMockPaymentMode("new-card");
                  setMockPaymentStatus("idle");
                }}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${
                  mockPaymentMode === "new-card"
                    ? "border-black/50 bg-black/[0.06]"
                    : "border-dashed border-black/15 bg-black/[0.03] hover:border-black/25"
                }`}
              >
                <Plus className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">Enter a new card</span>
              </button>

              {mockPaymentMode === "new-card" && (
                <div className="grid gap-2 rounded-lg border border-black/10 bg-white/70 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="flex min-w-0 flex-col gap-1">
                      <span className="text-gray-600">Cardholder name</span>
                      <input
                        value={cardholderName}
                        placeholder="Name on card"
                        onChange={handleCardholderNameChange}
                        className={inputClass}
                      />
                    </label>

                    <label className="flex min-w-0 flex-col gap-1">
                      <span className="text-gray-600">Billing email</span>
                      <input
                        value={billingEmail}
                        type="email"
                        placeholder="billing@example.com"
                        onChange={handleBillingEmailChange}
                        className={inputClass}
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1">
                    <span className="text-gray-600">Card number</span>
                    <input
                      value={mockCardNumber}
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      onChange={handleMockCardNumberChange}
                      className={inputClass}
                    />
                  </label>

                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="flex min-w-0 flex-col gap-1">
                      <span className="text-gray-600">Expiration</span>
                      <input
                        value={mockCardExpiry}
                        inputMode="numeric"
                        placeholder="MM/YY"
                        onChange={handleMockCardExpiryChange}
                        className={inputClass}
                      />
                    </label>

                    <label className="flex min-w-0 flex-col gap-1">
                      <span className="text-gray-600">CVC</span>
                      <input
                        value={mockCardCvc}
                        inputMode="numeric"
                        placeholder="123"
                        onChange={handleMockCardCvcChange}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>
              )}

              {mockPaymentStatus === "success" && (
                <div className="rounded-lg border border-black/10 bg-black/[0.03] p-3 text-gray-700">
                  Payment succeeded. When wired to Stripe, this is where the
                  modal would refresh the user query and close or show a
                  receipt.
                </div>
              )}

              <div className="rounded-lg border border-dashed border-black/15 bg-black/[0.03] px-3 py-4 text-center text-gray-500">
                Stripe Payment Element will replace this temporary card UI.
              </div>
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
                  {selectedTierLabel}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Due today</span>
                <span className="font-medium text-black">
                  {formatPrice(selectedOption?.price ?? null)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-black/10 bg-white/70 p-2">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
              <p className="leading-5 text-gray-600">
                Payments are secured through Stripe. CaseOS does not keep or
                store any payment information, and subscriptions can be canceled
                at any time.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {modalStep === "payment" && (
          <Button
            text="Back"
            style="secondary"
            onClick={returnToTierSelection}
            disabled={mockPaymentStatus === "processing"}
          />
        )}

        {modalStep === "select-tier" && (
          <Button text="Close" style="secondary" onClick={closeModal} />
        )}

        {modalStep === "select-tier" ? (
          <Button
            text="Continue"
            icon="continue"
            onClick={openPaymentStep}
            disabled={!isUpdatingTier}
            initiallyDisabled
          />
        ) : (
          <Button
            text={
              mockPaymentStatus === "processing" ? "Processing" : "Subscribe"
            }
            icon="save"
            onClick={handleMockPayment}
            disabled={!canSubmitMockPayment}
            initiallyDisabled
          />
        )}
      </div>
    </div>
  );
};

export default ModifySubscriptionModal;
