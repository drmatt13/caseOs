import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { useBillingSetupIntentQuery } from "#/api/react-query/billing";
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
  } = useBillingSetupIntentQuery(props.selectedOption.tier);

  return (
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
          <StripePaymentForm {...props} />
        </Elements>
      )}
    </>
  );
};

export default PaymentStep;
