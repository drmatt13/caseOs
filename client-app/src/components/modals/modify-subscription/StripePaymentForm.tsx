import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import Button from "#/components/ui/Button";
import { TONES } from "#/lib/tones";
import { currentUserQueryKey } from "#/api/currentUser/hooks";
import {
  planChangePreviewQueryKeyPrefix,
  useCreateSubscriptionMutation,
} from "#/api/billing/hooks";
import {
  formatBillingDate,
  formatCurrency,
  type PaymentStepProps,
} from "#/components/modals/modify-subscription/types";

function StripePaymentForm({
  selection,
  switchPreview,
  onPaymentStatusChange,
  onBack,
}: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const createSubscriptionMutation = useCreateSubscriptionMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { price, startTrial } = selection;
  const intervalSuffix = price.interval === "year" ? "/yr" : "/mo";

  const handleSubscribe = useCallback(async () => {
    if (!stripe || !elements) return;

    setErrorMessage(null);
    setIsProcessing(true);
    onPaymentStatusChange("processing");

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
      onPaymentStatusChange("idle");
      return;
    }

    const paymentMethodId = setupResult.setupIntent.payment_method;

    if (typeof paymentMethodId !== "string") {
      setErrorMessage("Stripe did not return a reusable payment method.");
      setIsProcessing(false);
      onPaymentStatusChange("idle");
      return;
    }

    try {
      await createSubscriptionMutation.mutateAsync({
        tier: selection.tier,
        priceId: price.live.stripePriceId,
        paymentMethodId,
        startTrial,
      });

      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      await queryClient.invalidateQueries({
        queryKey: planChangePreviewQueryKeyPrefix,
      });
      onPaymentStatusChange("success");
      setIsProcessing(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Subscription failed.",
      );
      onPaymentStatusChange("idle");
      setIsProcessing(false);
    }
  }, [
    elements,
    queryClient,
    createSubscriptionMutation,
    price.live.stripePriceId,
    selection.tier,
    onPaymentStatusChange,
    startTrial,
    stripe,
  ]);

  const dueToday = (() => {
    if (startTrial) return formatCurrency(0, price.currency);
    if (switchPreview) {
      return switchPreview.amountDueToday < 0
        ? `${formatCurrency(
            Math.abs(switchPreview.amountDueToday),
            switchPreview.currency,
          )} credit`
        : formatCurrency(switchPreview.amountDueToday, switchPreview.currency);
    }
    return formatCurrency(price.amount, price.currency);
  })();

  const renewalDate = formatBillingDate(switchPreview?.nextRenewalDate);

  return (
    <>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-black/15 bg-white/60 p-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-black/60" />
            <p className="font-serif text-md">Payment Details</p>
          </div>

          <div className="mt-3 rounded-lg border border-black/15 bg-white/80 p-3">
            <PaymentElement />
          </div>

          {errorMessage && (
            <div
              className={`mt-3 rounded-lg border p-3 ${TONES.critical.surface}`}
            >
              <p className={TONES.critical.ink}>{errorMessage}</p>
            </div>
          )}

          <div className="mt-3 rounded-lg border border-black/10 bg-black/[0.03] p-3 text-black/65">
            Stripe securely collects the card details here and returns only a
            payment method ID to Lawstruct.
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-black/[0.03] p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-black/60" />
            <p className="font-serif text-md">Billing Summary</p>
          </div>

          <div className="mt-3 space-y-2 text-black/65">
            <div className="flex justify-between gap-3">
              <span>Plan</span>
              <span className="font-medium text-black">
                {selection.tierLabel}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Billing</span>
              <span className="font-medium text-black">
                {price.interval === "year" ? "Yearly" : "Monthly"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Due today</span>
              <span
                className={`font-medium ${
                  switchPreview && switchPreview.amountDueToday < 0
                    ? TONES.positive.ink
                    : "text-black"
                }`}
              >
                {dueToday}
              </span>
            </div>
            {startTrial && (
              <div className="flex justify-between gap-3">
                <span>After {selection.trialDays ?? 7}-day trial</span>
                <span className="font-medium text-black">
                  {formatCurrency(price.amount, price.currency)}
                  {intervalSuffix}
                </span>
              </div>
            )}
            {!startTrial && switchPreview && (
              <div className="flex justify-between gap-3">
                <span>Then</span>
                <span className="font-medium text-black">
                  {formatCurrency(
                    switchPreview.nextRenewalAmount,
                    switchPreview.currency,
                  )}
                  {intervalSuffix}
                  {renewalDate ? ` starting ${renewalDate}` : ""}
                </span>
              </div>
            )}
            {!startTrial && !switchPreview && (
              <div className="flex justify-between gap-3">
                <span>Renews</span>
                <span className="font-medium text-black">
                  {formatCurrency(price.amount, price.currency)}
                  {intervalSuffix}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-black/10 bg-white/70 p-2">
            <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-black/50" />
            <p className="leading-5 text-black/65">
              Payments are secured through Stripe. Lawstruct does not keep or
              store any payment information, and subscriptions can be canceled
              at any time.
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
        />
      </div>
    </>
  );
}

export default StripePaymentForm;
