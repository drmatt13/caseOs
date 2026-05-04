import {
  type ChangeEvent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CreditCard,
  LockKeyhole,
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
  price: TierPrice | null;
  badge?: string;
  features: string[];
};

const inputClass =
  "rounded-lg border border-black/15 bg-white/70 px-2 py-2 outline-none transition-colors focus:border-black/40 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400";

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

const ModifySubscriptionModal = () => {
  const { setModal } = useContext(AppModalContext);

  const [selectedTier, setSelectedTier] =
    useState<SelectableAccountTier>("TRIAL");
  const [promoCode, setPromoCode] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

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
        price: pricing.TRIAL,
        badge: "Promo",
        features: ["6 digit promo code", "Stripe-secured payment"],
      },
      {
        tier: "PRO",
        name: "Pro",
        description: "Full subscription for active case work.",
        price: pricing.PRO,
        features: ["Stripe-secured payment", "Cancel any time"],
      },
      {
        tier: "ENTERPRISE",
        name: "Enterprise",
        description: "Expanded subscription for larger teams.",
        price: pricing.ENTERPRISE,
        features: ["Stripe-secured payment", "Priority billing setup"],
      },
    ];
  }, [tierPricing]);

  const selectedOption = tierOptions.find((option) => option.tier === selectedTier);
  const requiresPromoCode = selectedTier === "TRIAL";
  const requiresPayment = true;
  const hasPaymentDetails = Boolean(cardholderName.trim() && billingEmail.trim());
  const normalizedPromoCode = promoCode.trim();
  const promoCodeIsValid = /^\d{6}$/.test(normalizedPromoCode);
  const canContinue =
    (requiresPromoCode ? promoCodeIsValid : true) && hasPaymentDetails;
  const user = userResult?.success ? userResult.data.user : undefined;
  const currentTier = user?.accountTier ?? "FREE";

  const closeModal = useCallback(() => {
    setModal(null);
  }, [setModal]);

  const handleTierSelect = useCallback((tier: SelectableAccountTier) => {
    setSelectedTier(tier);
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

  const handleContinue = useCallback(() => {
    if (!canContinue) return;

    console.info("Subscription selection boilerplate", {
      selectedTier,
      promoCode: requiresPromoCode ? normalizedPromoCode : undefined,
      requiresPayment,
    });
  }, [
    canContinue,
    normalizedPromoCode,
    requiresPayment,
    requiresPromoCode,
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
            Review your current subscription and choose a new account tier.
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
            <p className="text-gray-600">Current subscription</p>
            <p className="mt-1 font-serif text-lg">
              {accountTierLabels[currentTier]}
            </p>
          </div>

          <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] text-gray-700">
            {currentTier === "FREE" ? "Default tier" : "Active tier"}
          </span>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {tierOptions.map((option) => {
          const isSelected = selectedTier === option.tier;

          return (
            <button
              key={option.tier}
              type="button"
              onClick={() => handleTierSelect(option.tier)}
              className={`flex min-h-40 cursor-pointer flex-col rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-black/50 bg-black/[0.06]"
                  : "border-black/10 bg-white/60 hover:border-black/25 hover:bg-black/[0.03]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-sm">{option.name}</p>
                  <p className="mt-1 text-[11px] leading-4 text-gray-600">
                    {option.description}
                  </p>
                </div>

                {option.badge && (
                  <span className="rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-[10px] text-gray-700">
                    {option.badge}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <span className="font-serif text-lg">
                  {isPending ? "..." : formatPrice(option.price)}
                </span>
                {option.price && (
                  <span className="ml-1 text-[11px] text-gray-500">/mo</span>
                )}
              </div>

              <div className="mt-auto flex flex-col gap-1 pt-3">
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
                Enter a 6 digit promo code to activate the free trial tier.
              </span>
            </label>
          )}

          <div className="mt-3 grid gap-2">
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

            <div className="rounded-lg border border-dashed border-black/15 bg-black/[0.03] px-3 py-4 text-center text-gray-500">
              Stripe card collection will mount here.
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
                {selectedOption?.name ?? "Trial"}
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
              Payments are secured through Stripe. CaseOS does not keep or store
              any payment information, and subscriptions can be canceled at any
              time.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button text="Cancel" style="secondary" onClick={closeModal} />
        <Button
          text={requiresPayment ? "Continue to Stripe" : "Apply Tier"}
          icon="save"
          onClick={handleContinue}
          disabled={!canContinue}
          initiallyDisabled
        />
      </div>
    </div>
  );
};

export default ModifySubscriptionModal;
