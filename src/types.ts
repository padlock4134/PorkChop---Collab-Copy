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
