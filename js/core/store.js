const state = {
  rawText: "",
  dataset: null,        // { columns: string[], rows: object[] }
  schema: null,         // { numeric: string[], categorical: string[] }
  ui: {
    xField: null,
    yField: null,
    normalise: false
  },
};

const listeners = new Set();

function notify() {
  for (const fn of listeners) fn(getState());
}

export function getState() {
  return structuredClone(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

export function setStatus(message) {
  const el = document.getElementById("status");
  if (el) el.textContent = message;
}

export function update(patch) {
  Object.assign(state, patch);
  notify();
}

export function updateUI(patch) {
  state.ui = { ...state.ui, ...patch };
  notify();
}
