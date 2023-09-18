// Suponhamos que temos os seguintes dados:
const data = [
  { name: "A", value: 10, lastValue: 0 },
  { name: "B", value: 15, lastValue: 10 },
  { name: "C", value: 5, lastValue: 3 },
  // ... mais dados conforme necessário
];

const margin = { top: 20, right: 30, bottom: 40, left: 90 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom,
  duration = 2500;

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([height, 0]).padding(0.1);

function update(data) {
  x.domain([0, d3.max(data, d => d.value)]);
  y.domain(
    data
      .sort((a, b) => b.value - a.value)
      .map(d => d.name)
  );

  const bars = svg.selectAll(".bar").data(data, d => d.name);

  bars
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", d => y(d.name))
    .attr("height", y.bandwidth())
    .transition()
    .duration(duration)
    .attr("x", d => x(d.lastValue))
    .attr("width", d => x(d.value) - x(d.lastValue));

  bars
    .transition()
    .duration(duration)
    .attr("y", d => y(d.name))
    .attr("x", d => x(d.lastValue))
    .attr("width", d => x(d.value) - x(d.lastValue));

  bars
    .exit()
    .transition()
    .duration(duration)
    .attr("width", d => x(d.lastValue))
    .remove();
}

// Atualize os dados conforme necessário
update(data);
