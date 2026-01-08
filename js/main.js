import { subscribe, update, updateUI, setStatus } from "./core/store.js";
import { parseCsv, detectSchema, coerceNumericRows } from "./data/parser.js";
import { renderScatter } from "./vis/scatter.js";
import { minMaxNormalise } from "./data/transform.js";

const fileInput = document.getElementById("fileInput");
const datasetMeta = document.getElementById("datasetMeta");
const previewTable = document.getElementById("previewTable");
const previewHead = previewTable.querySelector("thead");
const previewBody = previewTable.querySelector("tbody");

const xSelect = document.getElementById("xSelect");
const ySelect = document.getElementById("ySelect");
const renderBtn = document.getElementById("renderBtn");
const chartEl = document.getElementById("chart");
const normaliseToggle = document.getElementById("normaliseToggle");

const kInput = document.getElementById("kInput");
const featureSelect = document.getElementById("featureSelect");
const runKMeansBtn = document.getElementById("runKMeansBtn");
const kmeansStatus = document.getElementById("kmeansStatus");

const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const helpCloseBtn = document.getElementById("helpCloseBtn");

function openHelp() {
  helpModal.classList.add("open");
  helpModal.setAttribute("aria-hidden", "false");
}

function closeHelp() {
  helpModal.classList.remove("open");
  helpModal.setAttribute("aria-hidden", "true");
}

helpBtn.addEventListener("click", openHelp);
helpCloseBtn.addEventListener("click", closeHelp);

// Close when clicking outside the modal content
helpModal.addEventListener("click", (e) => {
  if (e.target === helpModal) closeHelp();
});

// Close with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && helpModal.classList.contains("open")) {
    closeHelp();
  }
});

function setMetaHTML(html) {
  datasetMeta.innerHTML = html;
}

function fillSelect(selectEl, options, selected) {
  selectEl.innerHTML = "";
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt;
    if (opt === selected) o.selected = true;
    selectEl.appendChild(o);
  }
}

function renderPreview(dataset, maxRows = 6) {
  previewHead.innerHTML = "";
  previewBody.innerHTML = "";

  if (!dataset) return;

  const tr = document.createElement("tr");
  for (const col of dataset.columns) {
    const th = document.createElement("th");
    th.textContent = col;
    tr.appendChild(th);
  }
  previewHead.appendChild(tr);

  for (const row of dataset.rows.slice(0, maxRows)) {
    const trb = document.createElement("tr");
    for (const col of dataset.columns) {
      const td = document.createElement("td");
      const v = row[col];
      td.textContent = v === undefined ? "" : String(v);
      trb.appendChild(td);
    }
    previewBody.appendChild(trb);
  }
}

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setStatus("Reading file...");
  try {
    const text = await file.text();
    setStatus("Parsing CSV...");

    const dataset = parseCsv(text, { maxRows: 20000 });
    const schema = detectSchema(dataset, { numericThreshold: 0.85 });
    const numericDataset = coerceNumericRows(dataset, schema.numeric);

    update({
      rawText: text,
      dataset: numericDataset,
      schema,
      ui: {
        xField: schema.numeric[0] ?? null,
        yField: schema.numeric[1] ?? schema.numeric[0] ?? null,
        normalise: false,
        kmeansLabels: null,
        kmeans: null,
      },
    });

    setStatus("Dataset loaded");
  } catch (err) {
    console.error(err);
    setStatus("Error");
    setMetaHTML(`<p><strong>Error:</strong> ${err.message}</p>`);
  } finally {
    fileInput.value = "";
  }
});

let kmeansWorker = null;
function getKMeansWorker() {
  if (!kmeansWorker) {
    kmeansWorker = new Worker(
      new URL("./workers/kmeans.worker.js", import.meta.url),
      { type: "module" }
    );
  }
  return kmeansWorker;
}

function getSelectedFeatures() {
  return Array.from(featureSelect.selectedOptions).map((o) => o.value);
}

normaliseToggle.addEventListener("change", () => {
  updateUI({ normalise: normaliseToggle.checked });
});

xSelect.addEventListener("change", () => updateUI({ xField: xSelect.value }));
ySelect.addEventListener("change", () => updateUI({ yField: ySelect.value }));

renderBtn.addEventListener("click", () => {
  const s = window.__APP_STATE;
  if (!s?.dataset || !s?.schema) return;

  const plotDataset = s.ui.normalise
    ? minMaxNormalise(s.dataset, s.schema.numeric)
    : s.dataset;

  renderScatter({
    el: chartEl,
    rows: plotDataset.rows,
    xField: s.ui.xField,
    yField: s.ui.yField,
  });
});

runKMeansBtn.addEventListener("click", () => {
  const s = window.__APP_STATE;
  if (!s?.dataset || !s?.schema) return;

  const features = getSelectedFeatures();
  if (features.length < 2) {
    kmeansStatus.textContent = "Please select at least 2 features.";
    return;
  }
  if (features.length > 8) {
    kmeansStatus.textContent =
      "Please select 2–8 features (recommended for clarity).";
    return;
  }

  const k = Math.max(2, Math.min(10, Number.parseInt(kInput.value, 10) || 3));

  const plotDataset = s.ui.normalise
    ? minMaxNormalise(s.dataset, s.schema.numeric)
    : s.dataset;

  kmeansStatus.textContent = "Running k-means in Web Worker…";
  runKMeansBtn.disabled = true;

  const worker = getKMeansWorker();
  worker.onmessage = (ev) => {
    const msg = ev.data;
    runKMeansBtn.disabled = false;

    if (!msg.ok) {
      kmeansStatus.textContent = `Error: ${msg.error}`;
      updateUI({ kmeansLabels: null, kmeans: null });
      return;
    }

    const { labels, iterations, inertia, counts } = msg;

    kmeansStatus.textContent =
      `Done: k=${k}, iters=${iterations}, inertia=${inertia.toFixed(2)} | ` +
      counts.map((c, i) => `C${i}:${c}`).join("  ");

    updateUI({
      kmeansLabels: labels,
      kmeans: { k, iterations, inertia, counts, features },
    });
  };

  worker.postMessage({
    rows: plotDataset.rows,
    features,
    k,
    maxIter: 30,
  });
});

subscribe((s) => {
  window.__APP_STATE = s;

  const ds = s.dataset;
  const schema = s.schema;

  if (!ds) return;

  renderPreview(ds);

  const plotDataset = s.ui.normalise ? minMaxNormalise(ds, schema.numeric) : ds;

  renderScatter({
    el: chartEl,
    rows: plotDataset.rows,
    xField: s.ui.xField,
    yField: s.ui.yField,
    labels: s.ui.kmeansLabels ?? null,
  });

  if (ds.rows.length === 0 || ds.columns.length === 0) {
    setMetaHTML(
      `<p><strong>No dataset loaded</strong></p><p>Upload a CSV to begin.</p>`
    );
    xSelect.disabled = true;
    ySelect.disabled = true;
    renderBtn.disabled = true;
    renderPreview(null);
    chartEl.textContent = "No data yet.";
    return;
  }

  setMetaHTML(`
    <p><strong>Rows:</strong> ${ds.rows.length}${
    ds.truncated ? " (truncated)" : ""
  }</p>
    <p><strong>Columns:</strong> ${ds.columns.length}</p>
    <p><strong>Numeric columns:</strong> ${schema.numeric.length}</p>
    <p><strong>Categorical columns:</strong> ${schema.categorical.length}</p>
  `);

  const numeric = schema.numeric;
  const canPlot = numeric.length >= 2;

  const canCluster = schema.numeric.length >= 2;
  featureSelect.disabled = !canCluster;
  runKMeansBtn.disabled = !canCluster;

  if (canCluster) {
    const prev = new Set(getSelectedFeatures());
    featureSelect.innerHTML = "";

    for (const col of schema.numeric) {
      const opt = document.createElement("option");
      opt.value = col;
      opt.textContent = col;
      if (prev.has(col)) opt.selected = true;
      featureSelect.appendChild(opt);
    }

    const selected = getSelectedFeatures();
    if (selected.length < 2) {
      const x = s.ui.xField ?? schema.numeric[0];
      const y = s.ui.yField ?? schema.numeric[1] ?? schema.numeric[0];
      for (const opt of featureSelect.options) {
        if (opt.value === x || opt.value === y) opt.selected = true;
      }
    }

    kmeansStatus.textContent =
      "Select 2–8 features, choose k, then run clustering.";
  } else {
    kmeansStatus.textContent =
      "Load a dataset with at least 2 numeric columns to enable clustering.";
  }

  xSelect.disabled = !canPlot;
  ySelect.disabled = !canPlot;
  renderBtn.disabled = !canPlot;

  if (canPlot) {
    // Fill dropdowns; keep selected where possible
    const x = s.ui.xField ?? numeric[0];
    const y = s.ui.yField ?? numeric[1] ?? numeric[0];

    fillSelect(xSelect, numeric, x);
    fillSelect(ySelect, numeric, y);
  } else {
    chartEl.textContent = "Need at least 2 numeric columns to plot.";
  }
});
