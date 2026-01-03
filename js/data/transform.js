/**
 * @param {{ columns: string[], rows: Object[] }} dataset
 * @param {string[]} numericCols
 * @returns {{ columns: string[], rows: Object[] }}
 */
export function minMaxNormalise(dataset, numericCols) {
  const mins = {};
  const maxs = {};

  // Initialise min/max
  for (const col of numericCols) {
    mins[col] = Infinity;
    maxs[col] = -Infinity;
  }

  for (const row of dataset.rows) {
    for (const col of numericCols) {
      const v = row[col];
      if (!Number.isFinite(v)) continue;
      if (v < mins[col]) mins[col] = v;
      if (v > maxs[col]) maxs[col] = v;
    }
  }

  const newRows = dataset.rows.map((row) => {
    const out = { ...row };

    for (const col of numericCols) {
      const v = row[col];
      if (!Number.isFinite(v)) continue;

      const min = mins[col];
      const max = maxs[col];
      const range = max - min;

      // If range is zero, all values are identical → set to 0.5 to avoid divide-by-zero
      out[col] = range === 0 ? 0.5 : (v - min) / range;
    }

    return out;
  });

  return { ...dataset, rows: newRows };
}
