// Requires D3 loaded globally via CDN in index.html (window.d3).
function clear(container) {
  while (container.firstChild) container.removeChild(container.firstChild);
}

export function renderScatter({ el, rows, xField, yField, labels = null }) {
  if (!window.d3) {
    el.textContent = "D3 not found. Check the script tag in index.html.";
    return;
  }

  clear(el);

  if (!rows?.length || !xField || !yField) {
    el.textContent = "Load a dataset and choose X/Y fields.";
    return;
  }

  const d3 = window.d3;

  const color = labels ? d3.scaleOrdinal(d3.schemeTableau10) : null;

  const points = rows
    .map((r, i) => ({ x: r[xField], y: r[yField], i }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  if (points.length < 5) {
    el.textContent = "Not enough numeric points to plot (need at least ~5).";
    return;
  }

  const width = Math.max(
    600,
    Math.floor(el.getBoundingClientRect().width || el.clientWidth || 0)
  );
  const height = 360;
  const margin = { top: 20, right: 20, bottom: 45, left: 55 };

  const svg = d3
    .select(el)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto");

  const x = d3
    .scaleLinear()
    .domain(d3.extent(points, (d) => d.x))
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(points, (d) => d.y))
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .attr("fill", "#a9acb5")
    .style("font-size", "12px")
    .text(xField);

  svg
    .append("text")
    .attr("x", -height / 2)
    .attr("y", 16)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("fill", "#a9acb5")
    .style("font-size", "12px")
    .text(yField);

  // Simple tooltip
  const tip = d3
    .select(el)
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("padding", "8px 10px")
    .style("border", "1px solid rgba(42,47,61,0.9)")
    .style("border-radius", "10px")
    .style("background", "rgba(12,15,22,0.95)")
    .style("color", "#e8e8ea")
    .style("font-size", "12px");

  svg
    .append("g")
    .selectAll("circle")
    .data(points)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 3.2)
    .attr("fill", (d) => {
      if (!labels) return "rgba(106,169,255,0.85)";
      const lab = labels[d.i];
      if (lab === -1 || lab === undefined || lab === null)
        return "rgba(169,172,181,0.55)";
      return color(lab);
    })
    .attr("fill-opacity", labels ? 0.8 : 0.65)

    .on("mouseenter", (event, d) => {
      const clusterLine = labels
        ? `<div><strong>Cluster</strong>: ${labels[d.i]}</div>`
        : "";

      tip.style("opacity", 1).html(
        `<div><strong>${xField}</strong>: ${d.x}</div>
     <div><strong>${yField}</strong>: ${d.y}</div>
     ${clusterLine}`
      );
    })

    .on("mousemove", (event) => {
      const rect = el.getBoundingClientRect();
      tip
        .style("left", `${event.clientX - rect.left + 12}px`)
        .style("top", `${event.clientY - rect.top + 12}px`);
    })
    .on("mouseleave", () => tip.style("opacity", 0));
}
