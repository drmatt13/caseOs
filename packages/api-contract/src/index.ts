export const API_ROUTE = {
  // Lambda Functions
  signIn: "/sign-in",
  signOut: "/sign-out",
  oauthCallback: "/oauth/callback",
  refresh: "/refresh",
  stripeWebhook: "/stripe/webhook",
  verifySession: "/verify-session",
  getUser: "/get-user",
  graphql: "/graphql",
  s3AccessBroker: "/s3-access-broker",
  billingListProducts: "/billing/list-products",
  billingCreateSetupIntent: "/billing/create-setup-intent",
  billingCreateSubscription: "/billing/create-subscription",
  // Containerized Services
  langGraphService: "/langgraph-service",
} as const;

export const PUBLIC_API_ROUTES = [
  API_ROUTE.signIn,
  API_ROUTE.signOut,
  API_ROUTE.oauthCallback,
  API_ROUTE.refresh,
  API_ROUTE.stripeWebhook,
] as const;

export const AUTHENTICATED_API_ROUTES = [
  API_ROUTE.verifySession,
  API_ROUTE.getUser,
  API_ROUTE.graphql,
  API_ROUTE.s3AccessBroker,
  API_ROUTE.billingListProducts,
  API_ROUTE.billingCreateSetupIntent,
  API_ROUTE.billingCreateSubscription,
] as const;

export const API_ROUTES = [
  ...PUBLIC_API_ROUTES,
  ...AUTHENTICATED_API_ROUTES,
] as const;

export type PublicApiRoute = (typeof PUBLIC_API_ROUTES)[number];
export type AuthenticatedApiRoute = (typeof AUTHENTICATED_API_ROUTES)[number];
export type ApiRoute = (typeof API_ROUTES)[number];
