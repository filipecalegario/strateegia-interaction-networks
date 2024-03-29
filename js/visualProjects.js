const svg = d3.select("svg");
const projectChooser = d3.select("#project-chooser");
const widthProjectChooser = projectChooser.node().getBoundingClientRect();
let width = widthProjectChooser.width;
let height = 1000;
const g = svg.append("g");
// g.append("rect").attr("width", 2).attr("height", 2).attr("fill", "black");
let toggle = false;

// update size-related forces
d3.select(window).on("resize", function () {
    // width = +svg.node().getBoundingClientRect().width;
    // height = +svg.node().getBoundingClientRect().height;
    // updateForces(consolidated_data.links);
    const projectChooser = d3.select("#project-chooser");
    const widthProjectChooser = projectChooser.node().getBoundingClientRect();
    width = widthProjectChooser.width;
    height = widthProjectChooser.height;
    //updateForces(data_links);
});

d3.select(window).on("load", function () {
    // d3.select("#filter-users").attr("checked", "true");
});

const zoom = d3
    .zoom()
    .extent([
        [0, 0],
        [width, height],
    ])
    .scaleExtent([0.3, 8])
    .on("zoom", zoomed);

svg.call(zoom);

function zoomed({ transform }) {
    g.attr("transform", transform);
}

let dataForExport = {};

export function setDataForExport(data) {
    dataForExport = data;
}

// svg objects
// let link;
// let node;
// let data;

// values for all forces
let forceProperties = {
    center: {
        x: 0.5,
        y: 0.5,
    },
    charge: {
        enabled: true,
        strength: -30,
        distanceMin: 1,
        distanceMax: 387.8,
    },
    collide: {
        enabled: true,
        strength: 0.01,
        iterations: 1,
        radius: 10,
    },
    forceX: {
        enabled: false,
        strength: 0.1,
        x: 0.5,
    },
    forceY: {
        enabled: false,
        strength: 0.1,
        y: 0.5,
    },
    link: {
        enabled: true,
        distance: 35,
        iterations: 5,
    },
};

//////////// FORCE SIMULATION ////////////

// force simulator
const simulation = d3.forceSimulation();

// set up the simulation and event to update locations after each tick
export function initializeSimulation(data_nodes, data_links) {
    simulation.nodes(data_nodes).on("tick", ticked);
    initializeForces(data_nodes, data_links);
    simulation.alpha(2).restart();
}

// add forces to the simulation
function initializeForces(data_nodes, data_links) {
    // add forces and associate each with a name
    simulation
        .force("center", d3.forceCenter())
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());

    // apply properties to each of the forces
    updateForces(data_links);
}

function updateForces(data_links, alpha = 0.2) {
    const centerX = width * forceProperties.center.x;
    const centerY = height * forceProperties.center.y;

    const forces = {
        center: ["x", "y"],
        charge: ["strength", "distanceMin", "distanceMax"],
        collide: ["strength", "radius", "iterations"],
        forceX: ["strength", "x"],
        forceY: ["strength", "y"],
    };

    for (let forceName in forces) {
        let force = simulation.force(forceName);
        forces[forceName].forEach((property) => {
            let value = forceProperties[forceName][property];
            if (property === "strength" || property === "iterations") {
                value *= forceProperties[forceName].enabled ? 1 : 0;
            }
            force[property](value);
        });
    }

    simulation.force("center").x(centerX).y(centerY);

    // Separate link force due to its specific requirements
    const linkForce = simulation.force("link");
    linkForce
        .id((d) => d.id)
        .distance(forceProperties.link.distance)
        .iterations(forceProperties.link.iterations);

    if (forceProperties.link.enabled) {
        linkForce.links(data_links);
    } else {
        linkForce.links([]);
    }

    simulation.alpha(alpha).restart();
}

//////////// DISPLAY ////////////

// color = d3.scaleOrdinal(d3.schemeCategory10); "#377eb8"

// generate the svg objects and force simulation
export function buildGraph(data_nodes, data_links) {
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
    // let colors =     ["#ac92ea", "#e3b692", "#ed7d31", "#3aadd9", "#eb5463", "#46ceac", "#fdcd56", "#d56fac", "#636c77"];
    // simulation.stop();
    svg.style("width", width + "px")
        .style("height", height + "px")
        .attr("viewBox", [0, 0, width, height]);

    const color = d3.scaleOrdinal().domain(categorias).range(colors);

    const node_size = d3
        .scaleOrdinal()
        .domain(categorias)
        .range([10, 9, 8, 7, 6, 4, 3, 7, 9]);

    // === LINKS ===
    let links_selection = g.selectAll("line.links").data(data_links);

    // Update existing links
    // (add any attribute or style updates required for existing links here)
    // Example:
    links_selection.style("stroke", "#aaa");

    // Enter new links
    links_selection
        .enter()
        .append("line")
        .attr("class", "links")
        .style("stroke", "#aaa");

    // Exit old links
    links_selection.exit().remove();

    // === NODES ===
    let nodes_selection = g.selectAll("g.nodes").data(data_nodes, (d) => d.id);

    // Update existing nodes
    nodes_selection
        .select("circle")
        .attr("fill", (d) => color(d.group))
        .attr("r", (d) => node_size(d.group));

    // Enter new nodes
    let node_group = nodes_selection
        .enter()
        .append("g")
        .attr("class", "nodes")
        .attr("cursor", "grab");

    let t = d3.transition().duration(500).ease(d3.easeLinear);

    node_group
        .append("a")
        .attr("xlink:href", (d) => d.dashboardUrl)
        .attr("target", "_blank")
        .append("circle")
        .attr("fill", "white")
        .attr("r", 0)
        .transition(t)
        .attr("r", (d) => node_size(d.group))
        .attr("fill", (d) => color(d.group))
        .attr("id", (d) => d.id);

    node_group
        .append("text")
        .text((d) => d.title)
        .attr("x", 6)
        .attr("y", 3)
        .style("display", "none");

    // Node tooltip
    node_group.append("title").text((d) => d.title);

    // Drag behaviors
    const drag = d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    node_group
        .call(drag)
        .on("mouseover", focus)
        .on("mouseout", unfocus)
        .each(function (d) {
            d.x = d.x || d.x === 0 ? width * 0.5 : d.x;
            d.y = d.y || d.y === 0 ? height * 0.5 : d.y;
        });

    simulation.nodes(data_nodes).on("tick", ticked);
    simulation.force("link").links(data_links);

    // Exit old nodes
    nodes_selection.exit().remove();

    // visualize the data
    updateDisplay();
}

// update the display based on the forces (but not positions)
function updateDisplay() {
    d3.selectAll("line.links")
        .attr("stroke-width", forceProperties.link.enabled ? 1 : 0.5)
        .attr("opacity", forceProperties.link.enabled ? 1 : 0)
        .lower();
}

// update the display positions after each simulation tick
function ticked() {
    d3.selectAll("line.links")
        .attr("x1", function (d) {
            return d.source.x;
        })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        });

    d3.selectAll("g.nodes").attr("transform", function (d) {
        // if (d.x == undefined || d.y == undefined) {
        //     return;
        // }
        // return "translate(" + (d.x || 0.0) + "," + (d.y || 0.0) + ")";
        return "translate(" + d.x + "," + d.y + ")";
    });
    // .attr("cx", function(d) { return d.x; })
    // .attr("cy", function(d) { return d.y; });

    d3.select("#alpha_value").style(
        "flex-basis",
        simulation.alpha() * 100 + "%"
    );
}

//////////// UI EVENTS ////////////

function dragstarted(event, d) {
    if (!event.active) {
        simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
    d3.selectAll("g.nodes").attr("cursor", "grabbing");
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0.0001);
    d.fx = null;
    d.fy = null;
    d3.selectAll("g.nodes").attr("cursor", "grab");
}

function focus(event, d) {
    d3.selectAll("g.nodes")
        .selectAll("text")
        .style("display", function (o) {
            return o.id == d.id ? "block" : "none";
        });
}

function unfocus(d) {
    d3.selectAll("g.nodes").selectAll("text").style("display", "none");
}

export function updateAll(data_links, alpha) {
    console.log("dataLinks %o", data_links);
    updateForces(data_links, alpha);
    updateDisplay();
}

export function saveJson() {
    var dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(dataForExport));
    var dlAnchorElem = document.getElementById("downloadAnchorElem");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "consolidated_data.json");
    dlAnchorElem.click();
}

export function saveAsSVG() {
    //get svg element.
    var svg = document.getElementById("main_svg");

    //get svg source.
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svg);

    //add name spaces.
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(
            /^<svg/,
            '<svg xmlns="http://www.w3.org/2000/svg"'
        );
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
        source = source.replace(
            /^<svg/,
            '<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
        );
    }

    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    //convert svg source to URI data scheme.
    var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);

    //set url value to a element's href attribute.
    let link_svg = document.getElementById("link_svg");
    // link_svg.href = url;
    link_svg.setAttribute("href", url);
    link_svg.setAttribute("download", "graph.svg");
    link_svg.click();
    //you can download svg file by right click menu.
}

//   .filter(time => data.nodes.some(d => contains(d, time)))
