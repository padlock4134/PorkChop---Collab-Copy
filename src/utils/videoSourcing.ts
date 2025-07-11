// Centralized logic for sourcing tutorial videos for a recipe
export function getMealVideoQuery(recipeTitle: string) {
  return recipeTitle ? `how to make ${recipeTitle}` : '';
}

export function getMainIngredientPrepQuery(mainIngredient: string, recipeTitle: string) {
  return mainIngredient && recipeTitle
    ? `how to prepare ${mainIngredient} for ${recipeTitle}`
    : '';
}
