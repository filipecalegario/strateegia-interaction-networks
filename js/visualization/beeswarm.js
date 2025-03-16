import { gatherMockupGraphData2 } from '../data/mockupGraphData.js';
import { NODE_GROUPS, NODE_COLORS } from '../core/config.js';
// Execute when DOM is fully loaded 
// document.addEventListener('DOMContentLoaded', async () => {
//     // Get data from the mockup function
//     const data = await gatherMockupGraphData2();
//     // Log the loaded data
//     console.log("Mockup graph data loaded:", data);
//     initBeeswarm(data);
// });

export async function initBeeswarm(data) {
    // Constantes de configuração
    const categorias = NODE_GROUPS;
    const colors = NODE_COLORS;
    const width = 800, height = 400;
    const margin = { top: 10, right: 10, bottom: 50, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Escala ordinal para cores
    const colorGroup = d3.scaleOrdinal().domain(categorias).range(colors);

    // Seleciona e configura o SVG
    const svg = d3.select("#beeswarm_svg")
        .selectAll("*").remove() // Limpa conteúdos anteriores
        .exit().select(function () { return this; }); // Garante que continuamos com a seleção correta

    d3.select("#beeswarm_svg")
        .attr("width", width)
        .attr("height", height);

    // Cria o grupo principal que receberá a transformação
    const g = d3.select("#beeswarm_svg").append("g");

    // Configura as datas e os tamanhos dos nós
    data.nodes.forEach(d => {
        d.date = d.createdAt;
    });

    const minTitleLength = d3.min(data.nodes, d => d.title ? d.title.length : 0);
    const maxTitleLength = d3.max(data.nodes, d => d.title ? d.title.length : 0);

    const radiusScale = d3.scaleLinear()
        .domain([minTitleLength, maxTitleLength])
        .range([3, 15])
        .clamp(true);

    data.nodes.forEach(d => {
        d.radius = radiusScale(d.title ? d.title.length : 0);
    });

    // Escala de tempo para o eixo X
    const xScale = d3.scaleTime()
        .domain(d3.extent(data.nodes, d => d.date))
        .range([0, innerWidth])
        .nice();

    // Configura e roda a simulação de forças
    const simulation = d3.forceSimulation(data.nodes)
        .force("x", d3.forceX(d => xScale(d.date)).strength(1))
        .force("y", d3.forceY(innerHeight / 2))
        .force("collide", d3.forceCollide(d => d.radius + 2))
        .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    // Calcula os limites dos nós utilizando reduce
    const bounds = data.nodes.reduce((acc, d) => ({
        minX: Math.min(acc.minX, d.x - d.radius),
        maxX: Math.max(acc.maxX, d.x + d.radius),
        minY: Math.min(acc.minY, d.y - d.radius),
        maxY: Math.max(acc.maxY, d.y + d.radius)
    }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    // Adiciona padding e calcula o scale para "zoom to fit"
    const padding = 20;
    bounds.minX -= padding; bounds.maxX += padding;
    bounds.minY -= padding; bounds.maxY += padding;

    const scale = Math.min(innerWidth / (bounds.maxX - bounds.minX), innerHeight / (bounds.maxY - bounds.minY));

    // Aplica a transformação de zoom e translação
    g.attr("transform", `translate(${margin.left}, ${margin.top}) scale(${scale}) translate(${-bounds.minX}, ${-bounds.minY})`);

    // Adiciona os círculos representando os nós
    g.selectAll("circle")
        .data(data.nodes)
        .enter().append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.radius)
        .attr("fill", d => colorGroup(d.group))
        .append("title")
        .text(d => `${d.title} (${d.group}) - ${d.title ? d.title.length : 0} chars`);

    // Adiciona o eixo X e rotaciona os labels para melhor visualização
    g.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Rótulo do eixo X
    g.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 60)
        .text("Timeline");

    // Legenda para o tamanho dos nós (baseado no comprimento do título)
    const sizeLegendGroup = d3.select("#beeswarm_svg").append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

    sizeLegendGroup.append("text")
        .text("Node Size: Title Length")
        .style("font-weight", "bold");

    const midTitleLength = Math.floor((minTitleLength + maxTitleLength) / 2);
    const sizeLegendData = [
        { label: `${minTitleLength} chars`, radius: radiusScale(minTitleLength) },
        { label: `${midTitleLength} chars`, radius: radiusScale(midTitleLength) },
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

    // Legenda para as cores dos nós
    const colorLegendGroup = d3.select("#beeswarm_svg").append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top + yOffset + 30})`);

    colorLegendGroup.append("text")
        .text("Node Color: Type")
        .style("font-weight", "bold");

    let colorYOffset = 20;
    categorias.forEach((category, i) => {
        colorLegendGroup.append("rect")
            .attr("x", 0)
            .attr("y", colorYOffset - 10)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", colors[i]);

        colorLegendGroup.append("text")
            .attr("x", 30)
            .attr("y", colorYOffset + 2)
            .text(category)
            .style("font-size", "12px");

        colorYOffset += 25;
    });
}