import { subscribe, update, updateUI, setStatus } from "./core/store.js";
import { parseCsv, detectSchema, coerceNumericRows } from "./data/parser.js";
import { renderScatter } from "./vis/scatter.js";

const fileInput = document.getElementById("fileInput");
const datasetMeta = document.getElementById("datasetMeta");
const previewTable = document.getElementById("previewTable");
const previewHead = previewTable.querySelector("thead");
const previewBody = previewTable.querySelector("tbody");

const xSelect = document.getElementById("xSelect");
const ySelect = document.getElementById("ySelect");
const renderBtn = document.getElementById("renderBtn");
const chartEl = document.getElementById("chart");

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
      ui: { xField: schema.numeric[0] ?? null, yField: schema.numeric[1] ?? schema.numeric[0] ?? null },
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

xSelect.addEventListener("change", () => updateUI({ xField: xSelect.value }));
ySelect.addEventListener("change", () => updateUI({ yField: ySelect.value }));

renderBtn.addEventListener("click", () => {
  const s = window.__APP_STATE;
  if (!s?.dataset || !s?.schema) return;

  renderScatter({
    el: chartEl,
    rows: s.dataset.rows,
    xField: s.ui.xField,
    yField: s.ui.yField,
  });
});

// Reactively update UI when state changes
subscribe((s) => {
  // Keep last state available for quick access
  window.__APP_STATE = s;

  const ds = s.dataset;
  const schema = s.schema;

  if (!ds) {
    setMetaHTML(`<p><strong>No dataset loaded</strong></p><p>Upload a CSV to begin.</p>`);
    xSelect.disabled = true;
    ySelect.disabled = true;
    renderBtn.disabled = true;
    renderPreview(null);
    chartEl.textContent = "No data yet.";
    return;
  }

  setMetaHTML(`
    <p><strong>Rows:</strong> ${ds.rows.length}${ds.truncated ? " (truncated)" : ""}</p>
    <p><strong>Columns:</strong> ${ds.columns.length}</p>
    <p><strong>Numeric columns:</strong> ${schema.numeric.length}</p>
    <p><strong>Categorical columns:</strong> ${schema.categorical.length}</p>
  `);

  renderPreview(ds);

  const numeric = schema.numeric;
  const canPlot = numeric.length >= 2;

  xSelect.disabled = !canPlot;
  ySelect.disabled = !canPlot;
  renderBtn.disabled = !canPlot;

  if (canPlot) {
    // Fill dropdowns; keep selected where possible
    const x = s.ui.xField ?? numeric[0];
    const y = s.ui.yField ?? numeric[1] ?? numeric[0];

    fillSelect(xSelect, numeric, x);
    fillSelect(ySelect, numeric, y);

    // Auto-render once after load
    renderScatter({ el: chartEl, rows: ds.rows, xField: x, yField: y });
  } else {
    chartEl.textContent = "Need at least 2 numeric columns to plot.";
  }
});
