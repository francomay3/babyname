export interface Weighted {
  id: string;
  matches: number;
}

/**
 * Picks two distinct items using weighted random selection.
 * Items with fewer matches have a higher probability of being picked.
 */
export function pickTwo<T extends Weighted>(items: T[]): [T, T] | null {
  if (items.length < 2) return null;

  const weights = items.map((item) => 1 / (item.matches + 1));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  function pickOne(exclude?: string): T {
    const pool = items.filter((item) => item.id !== exclude);
    const poolWeights = pool.map((item) => 1 / (item.matches + 1));
    const poolTotal = poolWeights.reduce((sum, w) => sum + w, 0);

    let r = Math.random() * poolTotal;
    for (let i = 0; i < pool.length; i++) {
      r -= poolWeights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  // Suppress unused warning — totalWeight used conceptually for clarity
  void totalWeight;

  const first = pickOne();
  const second = pickOne(first.id);
  return [first, second];
}
