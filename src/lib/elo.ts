const DELTA_PER_WIN = 1;

export function expectedScore(_ratingA: number, _ratingB: number): number {
  // Kept for compatibility with existing imports/tests; no longer used.
  return 0.5;
}

export function newRatings(
  winnerRating: number,
  loserRating: number
): { winner: number; loser: number } {
  return {
    winner: winnerRating + DELTA_PER_WIN,
    loser: loserRating - DELTA_PER_WIN,
  };
}
