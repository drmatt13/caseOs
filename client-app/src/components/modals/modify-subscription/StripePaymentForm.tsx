import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import Button from "#/components/Button";
import { currentUserQueryKey } from "#/api/currentUser/hooks";
import { useCreateSubscriptionMutation } from "#/api/billing/hooks";
import { formatPrice } from "#/components/modals/modify-subscription/types";
import { type PaymentStepProps } from "#/components/modals/modify-subscription/types";

function StripePaymentForm({
  selectedOption,
  startTrial,
  onPaymentStatusChange,
  onBack,
  onSubscribed,
}: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const queryClient = useQueryClient();
  const createSubscriptionMutation = useCreateSubscriptionMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = useCallback(async () => {
    if (!stripe || !elements || !selectedOption.price?.stripePriceId) return;

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
        tier: selectedOption.tier,
        priceId: selectedOption.price.stripePriceId,
        paymentMethodId,
        startTrial,
      });

      await queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
      onPaymentStatusChange("success");
      setIsProcessing(false);
      onSubscribed();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Subscription failed.",
      );
      onPaymentStatusChange("idle");
      setIsProcessing(false);
    }
  }, [
    elements,
    onSubscribed,
    queryClient,
    createSubscriptionMutation,
    selectedOption.price?.stripePriceId,
    selectedOption.tier,
    onPaymentStatusChange,
    startTrial,
    stripe,
  ]);

  return (
    <>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white/60 p-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-600" />
            <p className="font-serif text-md">Payment Details</p>
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
            <p className="font-serif text-md">Billing Summary</p>
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
        />
      </div>
    </>
  );
}

export default StripePaymentForm;
