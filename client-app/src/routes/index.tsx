import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "#/lib/auth";
import AppLayout from "#/components/layouts/AppLayout";
import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
import SelectCaseMenu from "#/components/menus/SelectCaseMenu";
import UserPanel from "#/components/menus/UserPanel";
import Workspace from "#/components/Workspace";

import { userSchema } from "@repo/database/src/table.schemas";
import { z } from "zod";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  component: App,
});

function App() {
  const user: z.infer<typeof userSchema> = {
    id: "8d56f660-3f27-4fe9-b636-7fc6af4f9425",
    cognitoSub: "mock-cognito-sub-123",
    email: "alex.carter@example.com",
    billingEmail: "billing@example.com",
    displayName: "Alex Carter",
    firstName: "Alex",
    lastName: "Carter",
    profilePicture: null,
    userName: "alex.carter",
    isPlatformAdmin: false,
    accountTier: "PRO",
    accountStatus: "ACTIVE",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    stripeProductId: null,
    stripeDefaultPaymentMethodId: null,
    subscriptionStatus: "ACTIVE",
    billingInterval: "MONTH",
    cancelAtPeriodEnd: false,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    trialStartsAt: null,
    trialEndsAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };

  return (
    <AppLayout>
      <LeftPanelLayout>
        <UserPanel user={user} settings={true} />
        <div className="text-xs">
          <p className="truncate">Select Workspace</p>
        </div>
        <div className="text-xs flex gap-1.5 mb-0.5 items-center">
          <select
            className="rounded-lg px-2 py-2.5 /mx-2 text-xs bg-gray-100 border border-black/15"
            name="Workspace"
            id="Workspace"
          >
            <option value="">Workspace 1</option>
            <option value="">Workspace 2</option>
            <option value="">Workspace 3</option>
          </select>
        </div>
        <SelectCaseMenu />
      </LeftPanelLayout>
      <Workspace />
    </AppLayout>
  );
}
