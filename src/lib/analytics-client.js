export function shouldLogPlaceOpen(
  previousSelectedRestaurantId,
  nextSelectedRestaurantId,
  hasSelectedRestaurant
) {
  if (!nextSelectedRestaurantId || !hasSelectedRestaurant) {
    return false
  }

  return previousSelectedRestaurantId !== nextSelectedRestaurantId
}
