import { gatherMockupGraphData2 } from './data/mockupGraphData.js';

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initBeeswarm();
});

async function initBeeswarm() {
    let categorias = [
        "project",
        "map",
        "divpoint",
        "question",
        "comment",
        "reply",
        "agreement",
        "user",
        "users",
    ];
    let colors = [
        "#023a78",
        "#0b522e",
        "#ff8000",
        "#974da2",
        "#e51d1d",
        "#377eb8",
        "#4eaf49",
        "#636c77",
        "#b2b7bd",
    ];

    const colorGroup = d3.scaleOrdinal().domain(categorias).range(colors);

    // Get data from the mockup function
    const data = await gatherMockupGraphData2();

    // Log the loaded data
    console.log("Mockup graph data loaded:", data);

    // SVG configuration
    const width = 1500, height = 1000;
    const svg = d3.select("#chart").attr("width", width).attr("height", height);
    // Increase left margin to ensure nodes on the left are visible
    const margin = { top: 50, right: 200, bottom: 80, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create a container group with margin translation
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Convert dates to Date objects
    const parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S.%LZ");
    data.nodes.forEach(d => d.date = parseDate(d.createdAt));

    // Calculate node sizes based on title length
    // Find min and max title lengths for scaling
    const minTitleLength = d3.min(data.nodes, d => d.title ? d.title.length : 0);
    const maxTitleLength = d3.max(data.nodes, d => d.title ? d.title.length : 0);

    // Create a scale for node radius based on title length
    // Set minimum radius to 3 and maximum to 15
    const radiusScale = d3.scaleLinear()
        .domain([minTitleLength, maxTitleLength])
        .range([3, 15])
        .clamp(true); // Prevent values outside the range

    // Assign radius to each node
    data.nodes.forEach(d => {
        d.radius = radiusScale(d.title ? d.title.length : 0);
    });

    // Time scale (X axis) - adjust range to account for margins
    const xScale = d3.scaleTime()
        .domain(d3.extent(data.nodes, d => d.date))
        .range([0, innerWidth])
        .nice(); // Make the scale nice round values

    // Force simulation - adjust to use the container group's coordinates
    const simulation = d3.forceSimulation(data.nodes)
        .force("x", d3.forceX(d => xScale(d.date)).strength(1))
        .force("y", d3.forceY(innerHeight / 2))
        .force("collide", d3.forceCollide(d => d.radius + 2)) // Use dynamic collision radius based on node size
        .stop();

    // Run simulation to avoid overlapping
    for (let i = 0; i < 300; ++i) simulation.tick();

    // Add circles to the container group
    g.selectAll("circle")
        .data(data.nodes)
        .enter().append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.radius) // Use the calculated radius
        .attr("fill", d => colorGroup(d.group))
        .append("title") // Tooltip
        .text(d => `${d.title} (${d.group}) - ${d.title ? d.title.length : 0} chars`);

    // Add X axis to the container group
    const xAxis = d3.axisBottom(xScale);
    g.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)"); // Rotate labels for better readability

    // Add X axis label
    g.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 60)
        .text("Timeline");

    // Add legend for node sizes
    const sizeLegendGroup = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    sizeLegendGroup.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Node Size: Title Length")
        .style("font-weight", "bold");

    // Add sample circles for the size legend
    const sizeLegendData = [
        { label: `${minTitleLength} chars`, radius: radiusScale(minTitleLength) },
        { label: `${Math.floor((minTitleLength + maxTitleLength) / 2)} chars`, radius: radiusScale(Math.floor((minTitleLength + maxTitleLength) / 2)) },
        { label: `${maxTitleLength} chars`, radius: radiusScale(maxTitleLength) }
    ];

    let yOffset = 20;
    sizeLegendData.forEach(item => {
        sizeLegendGroup.append("circle")
            .attr("cx", 10)
            .attr("cy", yOffset)
            .attr("r", item.radius)
            .attr("fill", "#666");

        sizeLegendGroup.append("text")
            .attr("x", 25)
            .attr("y", yOffset + 5)
            .text(item.label)
            .style("font-size", "12px");

        yOffset += item.radius * 2 + 10;
    });

    // Add legend for node colors
    const colorLegendGroup = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top + yOffset + 30})`);

    colorLegendGroup.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Node Color: Type")
        .style("font-weight", "bold");

    // Add color swatches for each category
    let colorYOffset = 20;
    categorias.forEach((category, i) => {
        // Add color swatch
        colorLegendGroup.append("rect")
            .attr("x", 0)
            .attr("y", colorYOffset - 10)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", colors[i]);

        // Add category label
        colorLegendGroup.append("text")
            .attr("x", 30)
            .attr("y", colorYOffset + 2)
            .text(category)
            .style("font-size", "12px");

        colorYOffset += 25; // Space between legend items
    });
} 