// Shared types for the project
export type Ingredient = {
  name: string;
  category: string;
};

export interface RecipeCard {
  equipment?: string[];
  name: string;
  category: string;
};

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: string;
  status: string;
  current_period_end: string;
  created_at: string;
};
