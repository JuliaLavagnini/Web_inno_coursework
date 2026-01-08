/**
 * K-Means Web Worker
 * Runs clustering off the main thread to keep UI responsive.
 *
 * Input:
 *  - rows: array of objects (dataset rows)
 *  - features: string[] (numeric column names)
 *  - k: number
 *  - maxIter: number
 *
 * Output:
 *  - labels: number[] cluster label per row index
 *  - centroids: number[][]
 *  - iterations: number
 *  - inertia: number
 *  - counts: number[] per cluster
 */
self.onmessage = (e) => {
  const { rows, features, k, maxIter = 30 } = e.data;

  try {
    // Build matrix X (n x d)
    const X = rows.map((r) => features.map((f) => r[f]));

    // Filter rows with any non-finite value; keep mapping to original indices
    const valid = [];
    for (let i = 0; i < X.length; i++) {
      const vec = X[i];
      let ok = true;
      for (let j = 0; j < vec.length; j++) {
        if (!Number.isFinite(vec[j])) { ok = false; break; }
      }
      if (ok) valid.push(i);
    }

    if (valid.length < k * 2) {
      throw new Error("Not enough valid numeric rows for chosen k/features.");
    }

    const Xv = valid.map((idx) => X[idx]);

    // Deterministic seed: pick evenly spaced points as initial centroids
    const centroids = initCentroidsEvenly(Xv, k);

    let labels = new Array(Xv.length).fill(0);
    let iterations = 0;

    for (; iterations < maxIter; iterations++) {
      const newLabels = assignLabels(Xv, centroids);
      const changed = anyLabelChanged(labels, newLabels);
      labels = newLabels;

      const newCentroids = recomputeCentroids(Xv, labels, k, centroids);
      const centroidShift = totalCentroidShift(centroids, newCentroids);
      for (let c = 0; c < k; c++) centroids[c] = newCentroids[c];

      // Stop if stable
      if (!changed || centroidShift < 1e-9) break;
    }

    const inertia = computeInertia(Xv, labels, centroids);
    const counts = countClusters(labels, k);

    // Map labels back to original rows; invalid rows get -1
    const fullLabels = new Array(rows.length).fill(-1);
    for (let i = 0; i < valid.length; i++) {
      fullLabels[valid[i]] = labels[i];
    }

    self.postMessage({
      ok: true,
      labels: fullLabels,
      centroids,
      iterations: iterations + 1,
      inertia,
      counts,
      features
    });
  } catch (err) {
    self.postMessage({ ok: false, error: err.message || String(err) });
  }
};

// ---------- helpers ----------
function initCentroidsEvenly(X, k) {
  const n = X.length;
  const centroids = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor((i * (n - 1)) / (k - 1 || 1));
    centroids.push(X[idx].slice());
  }
  return centroids;
}

function assignLabels(X, centroids) {
  const labels = new Array(X.length);
  for (let i = 0; i < X.length; i++) {
    let best = 0;
    let bestDist = Infinity;
    for (let c = 0; c < centroids.length; c++) {
      const d = sqDist(X[i], centroids[c]);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    labels[i] = best;
  }
  return labels;
}

function anyLabelChanged(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return true;
  return false;
}

function recomputeCentroids(X, labels, k, fallbackCentroids) {
  const d = X[0].length;
  const sums = Array.from({ length: k }, () => new Array(d).fill(0));
  const counts = new Array(k).fill(0);

  for (let i = 0; i < X.length; i++) {
    const c = labels[i];
    counts[c]++;
    const v = X[i];
    for (let j = 0; j < d; j++) sums[c][j] += v[j];
  }

  const centroids = Array.from({ length: k }, () => new Array(d).fill(0));
  for (let c = 0; c < k; c++) {
    if (counts[c] === 0) {
      // Empty cluster — keep previous centroid
      centroids[c] = fallbackCentroids[c].slice();
    } else {
      for (let j = 0; j < d; j++) centroids[c][j] = sums[c][j] / counts[c];
    }
  }
  return centroids;
}

function totalCentroidShift(A, B) {
  let s = 0;
  for (let c = 0; c < A.length; c++) s += sqDist(A[c], B[c]);
  return s;
}

function computeInertia(X, labels, centroids) {
  let total = 0;
  for (let i = 0; i < X.length; i++) {
    total += sqDist(X[i], centroids[labels[i]]);
  }
  return total;
}

function countClusters(labels, k) {
  const counts = new Array(k).fill(0);
  for (const l of labels) if (l >= 0) counts[l]++;
  return counts;
}

function sqDist(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return s;
}
