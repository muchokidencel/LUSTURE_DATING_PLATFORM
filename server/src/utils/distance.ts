/**
 * Calculates distance in kilometers between two coordinates using the Haversine formula.
 * Returns Infinity if any coordinate is null or undefined.
 */
export const getDistanceKm = (
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number => {
  if (lat1 === null || lat1 === undefined ||
      lon1 === null || lon1 === undefined ||
      lat2 === null || lat2 === undefined ||
      lon2 === null || lon2 === undefined) {
    return Infinity;
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
