import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { useBillingSetupIntentQuery } from "#/api/billing/hooks";
import { TONES } from "#/lib/tones";
import StripePaymentForm from "./StripePaymentForm";
import { type PaymentStepProps } from "#/components/modals/modify-subscription/types";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "",
);

const PaymentStep = (props: PaymentStepProps) => {
  const {
    data: setupIntent,
    isPending: setupIntentPending,
    error: setupIntentError,
  } = useBillingSetupIntentQuery(props.selection.tier);

  return (
    <>
      {setupIntentPending && (
        <div className="mt-4 rounded-lg border border-black/15 bg-white/60 p-4 text-black/65">
          Initializing Stripe payment details...
        </div>
      )}

      {(setupIntentError || !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) && (
        <div className={`mt-4 rounded-lg border p-3 ${TONES.critical.surface}`}>
          <p className={TONES.critical.ink}>
            Stripe payment details could not be initialized. Verify
            VITE_STRIPE_PUBLISHABLE_KEY and the create SetupIntent Lambda.
          </p>
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
          <StripePaymentForm {...props} />
        </Elements>
      )}
    </>
  );
};

export default PaymentStep;
