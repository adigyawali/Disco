// Representative AAMC total-score → percentile-rank reference points
// (based on AAMC's published 2022–2024 percentile ranks). Used for the
// built-in conversion table and for showing where a score lands.
export const PERCENTILE_TABLE: { score: number; percentile: number }[] = [
  { score: 528, percentile: 100 },
  { score: 525, percentile: 100 },
  { score: 522, percentile: 99 },
  { score: 520, percentile: 98 },
  { score: 518, percentile: 96 },
  { score: 515, percentile: 92 },
  { score: 513, percentile: 88 },
  { score: 511, percentile: 84 },
  { score: 510, percentile: 81 },
  { score: 508, percentile: 75 },
  { score: 506, percentile: 68 },
  { score: 504, percentile: 60 },
  { score: 502, percentile: 52 },
  { score: 500, percentile: 44 },
  { score: 498, percentile: 37 },
  { score: 496, percentile: 30 },
  { score: 494, percentile: 24 },
  { score: 492, percentile: 19 },
  { score: 490, percentile: 14 },
  { score: 488, percentile: 11 },
  { score: 486, percentile: 8 },
  { score: 484, percentile: 5 },
  { score: 482, percentile: 4 },
  { score: 480, percentile: 3 },
  { score: 478, percentile: 2 },
  { score: 472, percentile: 1 }
]

/** Nearest published percentile for a total score. */
export function percentileForScore(total: number): number {
  let best = PERCENTILE_TABLE[PERCENTILE_TABLE.length - 1]
  let bestDist = Infinity
  for (const row of PERCENTILE_TABLE) {
    const d = Math.abs(row.score - total)
    if (d < bestDist) {
      bestDist = d
      best = row
    }
  }
  return best.percentile
}
