import { Subscription } from "./shared-types";

export interface WristbandSessionMetadata {
  email: string;
  supabaseToken: string;
  role: WristbandRole;
  // Add other Wristband session metadata here in the future, if necessary.
}

export interface SubscriptionVerification {
  isPaid: boolean;
  subscription: Subscription;
}

export interface WristbandRole {
  id: string;
  name: string;
  displayName: string;
}
