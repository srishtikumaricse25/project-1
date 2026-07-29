import { GeoLocation } from '../types';

/**
 * Calculates perpendicular distance from a 2D coordinate P to line segment AB.
 */
function getPerpendicularDistance(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const [pLat, pLng] = p;
  const [aLat, aLng] = a;
  const [bLat, bLng] = b;

  const dx = bLng - aLng;
  const dy = bLat - aLat;

  if (dx === 0 && dy === 0) {
    return Math.hypot(pLat - aLat, pLng - aLng);
  }

  const num = Math.abs(dy * pLng - dx * pLat + bLng * aLat - bLat * aLng);
  const den = Math.hypot(dy, dx);
  return num / den;
}

/**
 * Robust Douglas-Peucker GPS polyline simplification algorithm.
 * Handles thousands of GPS breadcrumb points with configurable tolerance.
 *
 * @param points Array of GeoLocation objects
 * @param tolerance Distance threshold in degrees (~0.00005 ≈ 5 meters)
 * @returns Filtered array preserving route curvature and endpoints
 */
export function simplifyBreadcrumbs(
  points: GeoLocation[],
  tolerance: number = 0.00005
): GeoLocation[] {
  if (!Array.isArray(points) || points.length <= 2) {
    return points || [];
  }

  const startTime = performance.now();

  const recursiveSimplify = (pts: GeoLocation[]): GeoLocation[] => {
    if (pts.length <= 2) return pts;

    let maxDist = 0;
    let index = 0;
    const start = [pts[0].lat, pts[0].lng] as [number, number];
    const end = [pts[pts.length - 1].lat, pts[pts.length - 1].lng] as [number, number];

    for (let i = 1; i < pts.length - 1; i++) {
      const current = [pts[i].lat, pts[i].lng] as [number, number];
      const dist = getPerpendicularDistance(current, start, end);

      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }

    if (maxDist > tolerance) {
      const left = recursiveSimplify(pts.slice(0, index + 1));
      const right = recursiveSimplify(pts.slice(index));
      return [...left.slice(0, -1), ...right];
    }

    return [pts[0], pts[pts.length - 1]];
  };

  try {
    const result = recursiveSimplify(points);

    if (points.length > 200) {
      const duration = (performance.now() - startTime).toFixed(2);
      console.log(
        `[GeoUtils] Douglas-Peucker simplified ${points.length} GPS points down to ${result.length} points (${duration}ms, tolerance=${tolerance})`
      );
    }

    return result;
  } catch (error) {
    console.error('[GeoUtils] Error during polyline simplification, returning original points:', error);
    return points;
  }
}
