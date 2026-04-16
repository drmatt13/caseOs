import { createFileRoute, Link } from "@tanstack/react-router";
import { requireAuth } from "#/lib/auth";
import AppLayout from "#/components/layouts/AppLayout";
import LeftPanelLayout from "#/components/layouts/LeftPanelLayout";
// import SelectCaseMenu from "#/components/menus/SelectCaseMenu";
import WorkspaceMenu from "#/components/menus/WorkspaceMenu";
import UserPanel from "#/components/menus/UserPanel";
import { ArrowLeft } from "lucide-react";

import { userSchema } from "@repo/database/src/table.schemas";
import z from "zod";

export const Route = createFileRoute("/case/$id")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  // const { id } = Route.useParams();

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
        <div className="text-xs flex gap-1.5 items-center">
          <Link to="/">
            <div className="p-1.5 hover:bg-black/15 rounded-lg cursor-pointer">
              <ArrowLeft className="w-3 h-3" />
            </div>
          </Link>

          <p className="truncate">
            Sweeney et al. v. Corcoran Management Co., Inc.
          </p>
        </div>
        <input
          className="rounded-lg px-2 py-2.5 /mx-2 text-xs bg-black/5 text-black/60 border border-gray-200"
          placeholder="Search"
        />
        <WorkspaceMenu />
      </LeftPanelLayout>
    </AppLayout>
  );
}
