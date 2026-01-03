// Simple CSV parser and schema detector.
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur.trim());
  return out;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  if (v === "" || v.toLowerCase() === "na" || v.toLowerCase() === "null") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseCsv(text, { maxRows = 5000 } = {}) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least 1 data row.");
  }

  const header = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  if (header.length < 2) throw new Error("CSV must contain at least 2 columns.");

  const rows = [];
  for (let i = 1; i < lines.length && rows.length < maxRows; i++) {
    const parts = splitCsvLine(lines[i]);
    const obj = {};
    for (let c = 0; c < header.length; c++) {
      const key = header[c] || `col_${c}`;
      const raw = parts[c] ?? "";
      obj[key] = raw.replace(/^"|"$/g, "");
    }
    rows.push(obj);
  }

  return { columns: header, rows, truncated: rows.length < (lines.length - 1) ? true : false };
}

export function detectSchema(dataset, { numericThreshold = 0.85 } = {}) {
  const { columns, rows } = dataset;
  const numeric = [];
  const categorical = [];

  for (const col of columns) {
    let valid = 0;
    let numericCount = 0;

    for (const r of rows) {
      const val = r[col];
      if (val === undefined || val === null || String(val).trim() === "") continue;

      valid++;
      if (toNumberOrNull(val) !== null) numericCount++;
    }

    const ratio = valid === 0 ? 0 : numericCount / valid;
    if (ratio >= numericThreshold) numeric.push(col);
    else categorical.push(col);
  }

  return { numeric, categorical };
}

export function coerceNumericRows(dataset, numericCols) {
    const rows = dataset.rows.map((r) => {
    const out = { ...r };
    for (const col of numericCols) out[col] = toNumberOrNull(r[col]);
    return out;
  });

  return { ...dataset, rows };
}
