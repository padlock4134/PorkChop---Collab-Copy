// Utility functions for passively identifying main equipment and main ingredient

export function getMainEquipment(equipment: string[] = []): string | null {
  return equipment.length > 0 ? equipment[0] : null;
}

export function getMainIngredient(ingredients: string[] = []): string | null {
  return ingredients.length > 0 ? ingredients[0] : null;
}
