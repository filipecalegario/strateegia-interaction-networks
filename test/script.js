const svg = d3
    .select("body")
    .append("svg")
    .attr("width", 600)
    .attr("height", 400);

const simulation = d3
    .forceSimulation()
    .force(
        "link",
        d3.forceLink().id((d) => d.id)
    )
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(300, 200));

let data = {
    nodes: [{ id: "A" }, { id: "B" }, { id: "C" }],
    links: [
        { source: "A", target: "B" },
        { source: "B", target: "C" },
        { source: "C", target: "B" },
    ],
};

function update(data) {
    // Update links
    const links = svg
        .selectAll(".link")
        .data(data.links)
        .join("line")
        .attr("class", "link")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2);

    // Update nodes
    const nodes = svg
        .selectAll(".node")
        .data(data.nodes)
        .join("circle")
        .attr("class", "node")
        .attr("r", 5)
        .attr("fill", "#69b3a2")
        .call(
            d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
        );

    // Event listeners for simulation updates
    simulation.nodes(data.nodes).on("tick", ticked);
    simulation.force("link").links(data.links);

    function ticked() {
        links
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);

        nodes.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

update(data);
