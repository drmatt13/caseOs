import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CreditCard } from "lucide-react";

import Button from "#/components/ui/Button";
import { TONES } from "#/lib/tones";
import { currentUserQueryKey } from "#/api/currentUser/hooks";
import {
  planChangePreviewQueryKeyPrefix,
  useCreateSubscriptionMutation,
  usePlanChangePreviewQuery,
} from "#/api/billing/hooks";
import type { PlanChangePreview } from "#/api/billing/operations";
import {
  formatBillingDate,
  formatCurrency,
  type PaymentStatus,
  type PlanSelection,
} from "#/components/modals/modify-subscription/types";

type SwitchPlanStepProps = {
  selection: PlanSelection;
  currentTierLabel: string;
  onPaymentStatusChange: (status: PaymentStatus) => void;
  onBack: () => void;
  onUseDifferentCard: (preview: PlanChangePreview | null) => void;
};

function formatCardBrand(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

const SwitchPlanStep = ({
  selection,
  currentTierLabel,
  onPaymentStatusChange,
  onBack,
  onUseDifferentCard,
}: SwitchPlanStepProps) => {
  const queryClient = useQueryClient();
  const createSubscriptionMutation = useCreateSubscriptionMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: preview,
    isPending: previewPending,
    error: previewError,
  } = usePlanChangePreviewQuery(selection.price.live.stripePriceId);

  // No card on file means the switch cannot charge automatically; hand the
  // preview to the payment step so the user enters one.
  useEffect(() => {
    if (preview && !preview.paymentMethod) {
      onUseDifferentCard(preview);
    }
  }, [preview, onUseDifferentCard]);

  const handleConfirm = async () => {
    setErrorMessage(null);
    setIsProcessing(true);
    onPaymentStatusChange("processing");

    try {
      await createSubscriptionMutation.mutateAsync({
        tier: selection.tier,
        priceId: selection.price.live.stripePriceId,
        startTrial: false,
      });

      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      await queryClient.invalidateQueries({
        queryKey: planChangePreviewQueryKeyPrefix,
      });
      onPaymentStatusChange("success");
      setIsProcessing(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Plan change failed.",
      );
      onPaymentStatusChange("idle");
      setIsProcessing(false);
    }
  };

  if (previewError) {
    return (
      <>
        <div className={`mt-4 rounded-lg border p-3 ${TONES.critical.surface}`}>
          <p className={`text-md ${TONES.critical.ink}`}>
            The plan change could not be previewed.
          </p>
          <p className="mt-0.5 text-xs leading-5 text-black/65">
            {previewError.message}
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <Button text="Back" style="secondary" onClick={onBack} />
        </div>
      </>
    );
  }

  if (previewPending || !preview) {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="h-44 rounded-lg bg-black/10 md:col-span-2" />
        <div className="h-44 rounded-lg bg-black/10" />
      </div>
    );
  }

  const dueToday = preview.amountDueToday;
  const renewalDate = formatBillingDate(preview.nextRenewalDate);
  const intervalLabel =
    selection.price.interval === "year" ? "Yearly" : "Monthly";

  return (
    <>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-black/15 bg-white/60 p-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-black/60" />
            <p className="font-serif text-md">Plan Change</p>
          </div>

          <div className="mt-3 space-y-2 text-black/65">
            <div className="flex justify-between gap-3">
              <span>Current plan</span>
              <span className="font-medium text-black">
                {currentTierLabel}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>New plan</span>
              <span className="font-medium text-black">
                {selection.tierLabel} · {intervalLabel} billing
              </span>
            </div>

            <div className="my-2 border-t border-black/10" />

            <div className="flex justify-between gap-3">
              <span>Due today</span>
              <span
                className={`font-medium ${
                  dueToday < 0 ? TONES.positive.ink : "text-black"
                }`}
              >
                {dueToday < 0
                  ? `${formatCurrency(Math.abs(dueToday), preview.currency)} credit`
                  : formatCurrency(dueToday, preview.currency)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Then</span>
              <span className="font-medium text-black">
                {formatCurrency(preview.nextRenewalAmount, preview.currency)}
                {selection.price.interval === "year" ? "/yr" : "/mo"}
                {renewalDate ? ` starting ${renewalDate}` : ""}
              </span>
            </div>
          </div>

          {dueToday < 0 && (
            <p className="mt-3 text-xs leading-5 text-black/60">
              The unused portion of your current plan is applied as account
              credit toward future invoices.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-black/10 bg-black/[0.03] p-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-black/60" />
            <p className="font-serif text-md">Payment Method</p>
          </div>

          {preview.paymentMethod && (
            <div className="mt-3 rounded-lg border border-black/15 bg-white/70 p-2.5">
              <p className="font-medium text-black">
                {formatCardBrand(preview.paymentMethod.brand)} ····{" "}
                {preview.paymentMethod.last4}
              </p>
              <p className="mt-0.5 text-xs text-black/55">
                Expires {String(preview.paymentMethod.expMonth).padStart(2, "0")}
                /{preview.paymentMethod.expYear}
              </p>
            </div>
          )}

          <p className="mt-3 text-xs leading-5 text-black/60">
            Your card on file is charged when you confirm. Subscriptions can be
            changed again at any time.
          </p>

          <button
            type="button"
            onClick={() => onUseDifferentCard(preview)}
            disabled={isProcessing}
            className="mt-2 cursor-pointer text-xs text-black/55 underline-offset-2 hover:text-black hover:underline"
          >
            Use a different card
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className={`mt-3 rounded-lg border p-3 ${TONES.critical.surface}`}>
          <p className={`text-md ${TONES.critical.ink}`}>{errorMessage}</p>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button
          text="Back"
          style="secondary"
          onClick={onBack}
          disabled={isProcessing}
        />
        <Button
          text={isProcessing ? "Processing" : "Confirm change"}
          icon="check"
          onClick={handleConfirm}
          disabled={isProcessing}
        />
      </div>
    </>
  );
};

export default SwitchPlanStep;
