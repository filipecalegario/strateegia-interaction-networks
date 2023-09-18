import { gatherGraphData } from "./data/graphData.js";
import { getAllProjects } from "https://unpkg.com/strateegia-api/strateegia-api.js";

const access_token = localStorage.getItem("strateegiaAccessToken");
let intervalCheck = "inactive";
let nodeToSummary = [];
console.log(localStorage);

const svgBarG = d3.select("#barChart");
const margin = { top: 20, right: 20, bottom: 30, left: 120 }; // Aumente a margem esquerda para rótulos
const width = +svgBarG.attr("width") - margin.left - margin.right;
const height = +svgBarG.attr("height") - margin.top - margin.bottom;
const g = svgBarG.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().rangeRound([height, 0]).padding(0.1);

const xAxis = g.append("g").attr("class", "axis axis--x");
const yAxis = g.append("g").attr("class", "axis axis--y");

const colors = d3.scaleOrdinal(d3.schemeTableau10); // Paleta de cores



const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const global_selected_mode = urlParams.get('mode') || "projeto";
console.log("MODE IS: " + global_selected_mode);

if (global_selected_mode === "usuário") {
    d3.select("#applet-title").text("redes de pessoas");
} else if (global_selected_mode === "projeto") {
    d3.select("#applet-title").text("redes de interações");
} else if (global_selected_mode === "indicadores") {
    d3.select("#applet-title").text("indicadores da jornada");
}

export let cData = {
    "nodes": [],
    "links": []
};

export let fData = {};

let counter = [
    { "id": "users", "title": "usuários", "quant": 0, "color": "#636c77" },
    { "id": "active_users", "title": "usuários ativos", "quant": 0, "color": "#636c77" },
    { "id": "inactive_users", "title": "usuários inativos", "quant": 0, "color": "#636c77" },
    { "id": "comments", "title": "respostas", "quant": 0, "color": "#e51d1d" },
    { "id": "replies", "title": "comentários", "quant": 0, "color": "#377eb8" },
    { "id": "agreements", "title": "concordar", "quant": 0, "color": "#4eaf49" },
    { "id": "divpoints", "title": "pontos divergência", "quant": 0, "color": "#ff8000" },
    { "id": "questions", "title": "questões", "quant": 0, "color": "#974da2" },
];

let filters = {};

function initializeProjectList() {
    getAllProjects(access_token).then(async labs => {
        console.log("getAllProjects()");
        console.log(labs);
        // Initial project
        let listProjects = [];
        for (let i = 0; i < labs.length; i++) {
            let currentLab = labs[i];
            if (currentLab.lab.name == null) {
                currentLab.lab.name = "Personal";
            }
            for (let j = 0; j < currentLab.projects.length; j++) {
                const project = currentLab.projects[j];
                //console.log(`${currentLab.lab.name} -> ${project.title}`);
                listProjects.push({
                    "id": project.id,
                    "title": project.title,
                    "lab_id": currentLab.lab.id,
                    "lab_title": currentLab.lab.name
                });
            }
        }
        let options = d3.select("#projects-list")
            .on("change", () => {
                let selected_project = d3.select("#projects-list").property('value');
                localStorage.setItem("selectedProject", selected_project);
                // let selected_mode = d3.select("#modes-list").property('value');
                d3.select("#project-link").attr("href", `https://app.strateegia.digital/journey/${selected_project}`);
                drawProject(selected_project, global_selected_mode);
                d3.select("#choose_date").text("filtrar itens por data: ");
                d3.select("#time_ticks").property("value", 50);
            })
            .selectAll("option")
            .data(listProjects, d => d.id);

        options.enter()
            .append("option")
            .attr("value", (d) => { return d.id })
            .text((d) => { return `${d.lab_title} -> ${d.title}` });

        let modes = ["indicadores", "projeto", "usuário"];
        d3.select("#modes-list")
            .on("change", () => {
                let selected_project = d3.select("#projects-list").property('value');
                // let selected_mode = d3.select("#modes-list").property('value');
                drawProject(selected_project, global_selected_mode);

            })
            .selectAll("option")
            .data(modes)
            .enter()
            .append("option")
            .attr("value", (d) => { return d })
            .text((d) => { return d });

        const defaultSelectedProject = labs[0].projects[0].id;
        localStorage.setItem("selectedProject", defaultSelectedProject);
        //const project = await getProjectById(access_token, defaultSelectedProject);
        //const mapId = project.maps[0].id;
        d3.select("#project-link").attr("href", `https://app.strateegia.digital/journey/${defaultSelectedProject}`);
        drawProject(defaultSelectedProject, global_selected_mode);
    });
    d3.select("#time_ticks").on("input", (e) => {
        console.log("time_ticks %", e);
        filterByTime(e.target.value);
    });
}

async function drawProject(projectId, s_mode) {

    d3.select("#loading-spinner").style("display", "block");
    d3.select("#graph-view").style("display", "none");
    d3.select("#statistics").style("display", "none");
    console.log("start loading... %o", new Date());

    cData = {
        "nodes": [],
        "links": []
    }

    fData = {
        "nodes": [],
        "links": []
    }

    let promisses = [];

    const selected_mode = s_mode;

    if (selected_mode === "usuário") {
        filters = {
            group: group => ["comment", "reply", "agreement", "users", "user"].includes(group),
            // group: group => ["project", "map", "kit", "question", "comment", "reply", "agreement", "users", "user"].includes(group),
        };
    } else if (selected_mode === "projeto") {
        filters = {
            // group: group => ["comment", "reply", "agreement", "users", "user"].includes(group),
            group: group => ["project", "map", "divpoint", "question", "comment", "reply", "agreement"].includes(group),
        };
    } else if (selected_mode === "indicadores") {
        filters = {
            group: group => ["project", "map", "divpoint", "question", "comment", "reply", "agreement", "users", "user"].includes(group),
        };
    }

    cData = await gatherGraphData(access_token, projectId, selected_mode);
    console.log(cData);
    setDataForExport(cData);

    if (selected_mode !== "indicadores") {
        initializeGraph();
    } else {
        const filteredData = applyFilters(cData);
        fData = filteredData;
        countStatistics(fData);
    }

    d3.select("#loading-spinner").style("display", "none");
    d3.select("#graph-view").style("display", "block");
    d3.select("#statistics").style("display", "block");
    console.log("stop loading... %o", new Date());

}

/* 
    =============================
    Functions for manipulating the graph
    =============================
 */

function commonFilterAction() {
    const filteredData = applyFilters(cData);
    console.log("after applyFilters %o", filteredData);
    fData = filteredData;
    countStatistics(fData);
    buildGraph(filteredData.nodes, filteredData.links);
    return filteredData;
}

function initializeGraph() {
    const filteredData = commonFilterAction();
    initializeSimulation(filteredData.nodes, filteredData.links);
    updateAll(filteredData.links);
}

function updateGraph() {
    const filteredData = commonFilterAction();
    updateAll(filteredData.links);
}

async function updateGraphWithNewData() {
    cData = await gatherGraphData(access_token, localStorage.getItem("selectedProject"), global_selected_mode);
    console.log("updateGraphWithNewData() %o", cData);
    const filteredData = commonFilterAction();
    updateAll(filteredData.links);
}


/* 
    =============================
    Functions for filtering data for graph
    =============================
 */

/**
 * Filters an array of objects using custom predicates.
 *
 * @param  {Array}  array: the array to filter
 * @param  {Object} filters: an object with the filter criteria
 * @return {Array}
 * REFERENCE: https://gist.github.com/jherax/f11d669ba286f21b7a2dcff69621eb72
 */
function filterArray(array, filters) {
    const filterKeys = Object.keys(filters);
    return array.filter(item => {
        // validates all filter criteria
        return filterKeys.every(key => {
            // ignores non-function predicates
            if (typeof filters[key] !== 'function') return true;
            return filters[key](item[key]);
        });
    });
}

function applyFilters(inputData) {
    console.log("applyFilters list of filters %o", filters);
    console.log("applyFilters inputData %o", inputData);
    const otherData = {
        "nodes": [...inputData.nodes],
        "links": [...inputData.links]
    }
    let filteredData = {
        "nodes": [],
        "links": []
    };
    filteredData.nodes = filterArray(inputData.nodes, filters);
    let nodeIDs = [];
    for (let index = 0; index < filteredData.nodes.length; index++) {
        const element = filteredData.nodes[index].id;
        nodeIDs.push(element);
    }
    filteredData.links = inputData.links.filter(d => {
        const isDSource = nodeIDs.includes(d.source);
        const isDTarget = nodeIDs.includes(d.target);
        const isDSourceID = nodeIDs.includes(d.source.id);
        const isDTargetID = nodeIDs.includes(d.target.id);
        const condition1 = isDSource && isDTarget || isDSourceID && isDTargetID;
        return condition1;
    });
    fData = filteredData;
    return filteredData;
}

function filterByTime(inputDate) {
    let parseTime = d3.timeFormat("%d/%m/%Y - %H:%M:%S");

    let timeScale = d3.scaleTime().domain([0, 50])
        .range([d3.min(cData.nodes, d => d.createdAt), d3.max(cData.nodes, d => d.createdAt)]);
    let dateLimit = timeScale(inputDate);

    filters.createdAt = createdAt => createdAt <= dateLimit;
    d3.select("#choose_date").text(`filtrar itens por data: ${parseTime(dateLimit)}`)

    updateGraph();
}

/* 
    =============================
    Counter
    =============================
 */

function countStatistics(input_data) {

    const selected_mode = global_selected_mode;
    counter.forEach(function (d, i) {
        d.quant = 0;
    });
    for (let i = 0; i < input_data.nodes.length; i++) {
        const e = input_data.nodes[i];
        if (e.group === "user") {
            const c = counter.find(x => x.id === "users");
            c.quant = c.quant + 1;
            // Check if user has links in input_data.links
            let user_links = input_data.links.filter(d => {
                return d.source === e.id;
            });
            if (user_links.length > 0) {
                const c = counter.find(x => x.id === "active_users");
                c.quant = c.quant + 1;
            } else {
                const c = counter.find(x => x.id === "inactive_users");
                c.quant = c.quant + 1;
            }
        } else if (e.group === "comment") {
            const c = counter.find(x => x.id === "comments");
            c.quant = c.quant + 1;
        } else if (e.group === "reply") {
            const c = counter.find(x => x.id === "replies");
            c.quant = c.quant + 1;
        } else if (e.group === "agreement") {
            const c = counter.find(x => x.id === "agreements");
            c.quant = c.quant + 1;
        } else if (e.group === "divpoint") {
            const c = counter.find(x => x.id === "divpoints");
            c.quant = c.quant + 1;
        } else if (e.group === "question") {
            const c = counter.find(x => x.id === "questions");
            c.quant = c.quant + 1;
        }
    }

    let filter = {};

    if (selected_mode === "projeto") {
        filter = {
            id: id => ["comments", "replies", "agreements", "divpoints", "questions"].includes(id),
        };
    } else if (selected_mode === "usuário") {
        filter = {
            id: id => ["comments", "replies", "agreements", "users", "active_users"].includes(id),
        };
    } else if (selected_mode === "indicadores") {
        filter = {
            id: id => ["comments", "replies", "agreements", "users", "questions", "active_users", "inactive_users"].includes(id),
        };
    }

    let data = filterArray(counter, filter);
    console.log("data %o", data);

    if (selected_mode === "usuário" || selected_mode === "projeto") {
        d3.select("#indicators").style("display", "none");
        d3.select("#stat_list").style("display", "block");
        d3.select("#graph-view").style("display", "block");
        d3.select("#main_svg").style("display", "block");
        let ul_ = d3.select("#stat_list")
            .selectAll("li")
            .data(data, d => d.id);
        ul_
            .enter()
            .append("li")
            .style("color", d => d.color)
            .text(d => `${d.title} ${d.quant}`);
        ul_
            .style("color", d => d.color)
            .text(d => `${d.title} ${d.quant}`);
        ul_
            .exit()
            .remove();
    } else if (selected_mode === "indicadores") {
        // Make sure the list is visible
        d3.select("#indicators").style("display", "block");
        d3.select("#stat_list").style("display", "none");
        d3.select("#graph-view").style("display", "none");
        d3.select("#main_svg").style("display", "none");


        let usuarios = data.find(d => d.id === "users").quant;
        let usuarios_ativos = data.find(d => d.id === "active_users").quant;
        let usuarios_inativos = data.find(d => d.id === "inactive_users").quant;
        let indice_atividade = (usuarios_ativos / usuarios) * 100;

        let questoes_num = data.find(d => d.id === "questions").quant;
        let respostas_num = data.find(d => d.id === "comments").quant;
        let comentarios_num = data.find(d => d.id === "replies").quant;
        let concordar_num = data.find(d => d.id === "agreements").quant;
        let interacoes_num = comentarios_num + concordar_num;

        let respostas_reduzidas = respostas_num / 2;

        let respostas_potenciais = usuarios_ativos * questoes_num;
        let interacoes_potenciais = usuarios_ativos * respostas_reduzidas;

        let engajamento_questoes = (respostas_num / respostas_potenciais) * 100;
        let engajamento_interacoes = (interacoes_num / interacoes_potenciais) * 100;

        let engajamento_media = (engajamento_questoes + engajamento_interacoes) / 2;

        engajamento_questoes = engajamento_questoes.toFixed(2);
        engajamento_interacoes = engajamento_interacoes.toFixed(2);
        d3.select("#pessoas_num").text(usuarios);
        d3.select("#pessoas_inativas_num").text(usuarios_inativos);
        d3.select("#indice_atividade_num").text(indice_atividade.toFixed(2) + "%");
        d3.select("#questoes_num").text(questoes_num);
        d3.select("#respostas_num").text(respostas_num);
        d3.select("#respostas_potenciais_num").text(respostas_potenciais);
        d3.select("#engajamento_questoes_num").text(engajamento_questoes + "%");
        d3.select("#comentarios_num").text(comentarios_num);
        d3.select("#concordar_num").text(concordar_num);
        d3.select("#interacoes_num").text(interacoes_num);
        d3.select("#interacoes_potenciais_num").text(interacoes_potenciais);
        d3.select("#engajamento_interacoes_num").text(engajamento_interacoes + "%");
        d3.select("#engajamento_media_num").text(engajamento_media.toFixed(2) + "%");
    }

}

function initializePeriodicCheckButtonControls() {
    let button = d3.select("#periodic-check-button");
    button.text("iniciar checagem periódica");
    button.classed("btn-outline-success", true);
    button.on("click", () => {
        if (intervalCheck == "inactive") {
            startPeriodicCheck();
        } else {
            stopPeriodicCheck();
        }
    });
    let intervals = d3.select("#intervals");
    const intervalsOptions = [{ value: "1000", text: "1 segundo" }, { value: "5000", text: "5 segundos" }, { value: "10000", text: "10 segundos" }, { value: "15000", text: "15 segundos" }, { value: "30000", text: "30 segundos" }, { value: "60000", text: "1 minuto" }, { value: "120000", text: "2 minutos" }, { value: "300000", text: "5 minutos" }, { value: "600000", text: "10 minutos" }, { value: "1800000", text: "30 minutos" }, { value: "3600000", text: "1 hora" }];
    intervalsOptions.forEach(function (interval) {
        intervals.append("option").attr("value", interval.value).text(interval.text).classed("dropdown-item", true);
    });
}

function startPeriodicCheck() {
    let button = d3.select("#periodic-check-button");
    // let selectedDivPoint = localStorage.getItem("selectedDivPoint");
    // if (selectedDivPoint !== null && selectedDivPoint !== "null") {
    const chosenInterval = d3.select("#intervals").property("value");
    intervalCheck = setInterval(() => { periodicCheck() }, chosenInterval);

    button.text("parar checagem periódica");
    button.classed("btn-outline-success", false);
    button.classed("btn-outline-danger", true);
    // } else {
    //     console.log("Não há ponto de divergência selecionado");
    // }
}

function stopPeriodicCheck() {
    let button = d3.select("#periodic-check-button");
    clearInterval(intervalCheck);
    intervalCheck = "inactive";
    button.text("iniciar checagem periódica");
    button.classed("btn-outline-success", true);
    button.classed("btn-outline-danger", false);
}

async function periodicCheck() {
    const selectedProject = localStorage.getItem("selectedProject");
    console.log(`periodicCheck(): ${selectedProject}`);
    updateGraphWithNewData();
    nodeToSummary = transformNodesToSummary(cData.nodes);
    renderRanking(nodeToSummary);
    updateBarChartData(nodeToSummary);
    console.log("nodes to summary %o", nodeToSummary);
    statusUpdate();
}

function statusUpdate() {
    let statusOutput = d3.select("#periodic-check-status");
    statusOutput.classed("alert alert-secondary", true);
    let currentTime = new Date();
    let currentTimeFormatted = d3.timeFormat("%d/%m/%Y %H:%M:%S")(currentTime);
    statusOutput.text("última checagem: " + currentTimeFormatted);
}

function transformNodesToSummary(nodes) {
    console.log("transformNodesToSummary input: %o", nodes)
    const userSummaries = {};

    nodes.forEach(node => {
        if (node.group === "user") {
            userSummaries[node.id] = {
                idPessoa: node.id,
                name: node.title,
                commentCount: 0,
                replyCount: 0,
                soma: 0
            };
        }
    });

    nodes.forEach(node => {
        if (node.parentId === null) return;

        const parent = userSummaries[node.parentId];

        if (!parent) return;

        if (node.group === "comment") {
            parent.commentCount++;
            parent.soma++;
        } else if (node.group === "reply") {
            parent.replyCount++;
            parent.soma++;
        }
    });

    return Object.values(userSummaries);
}

// Função de renderização
function renderRanking(dataset) {

    console.log("renderRanking %o", dataset);
    // Ordena os dados
    dataset.sort((a, b) => b.soma - a.soma);

    // Seleciona o contêiner e vincula os dados
    const p = d3.select("#ranking")
        .selectAll("p")
        .data(dataset, d => d.idPessoa); // Use a chave (idPessoa) para ajudar no join

    // Para novos dados: insira parágrafos e defina o texto
    p.enter()
        .append("p")
        .text(d => `${d.name} - ${d.soma}`);

    // Para dados existentes: atualize o texto
    p.text(d => `${d.name} - ${d.soma}`);

    // Para dados removidos: remova o parágrafo
    p.exit().remove();
}

// Chame a função de renderização pela primeira vez

function updateBarChartData(newData) {
    // Ordenar os dados pela coluna "soma"
    newData.sort((a, b) => b.soma - a.soma);

    x.domain([0, d3.max(newData, d => d.soma)]);
    y.domain(newData.map(d => d.name).reverse());

    xAxis.transition().duration(1000).call(d3.axisTop(x));

    // Atualização da transição do eixo Y
    yAxis.transition().duration(1000).call(d3.axisLeft(y))
        .selectAll(".tick")  // Selecionando todos os ticks (incluindo rótulos)
        .delay((d, i) => i * 100);  // Adicionando um delay para cada tick para dar efeito de atualização sequencial

    const bars = g.selectAll(".bar").data(newData, d => d.idPessoa);

    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.name))
        .attr("height", y.bandwidth())
        .attr("x", 0)
        .merge(bars)
        .transition().duration(1000)
        .attr("y", d => y(d.name))  // Garanta que a posição y está sendo atualizada
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.soma))
        .attr("fill", d => colors(d.name));

    bars.exit().remove();
}


// ================================================
// Suponhamos que temos os seguintes dados:
// const data2 = [
//     { name: "A", value: 20, lastValue: 0 },
//     { name: "B", value: 15, lastValue: 10 },
//     { name: "C", value: 5, lastValue: 3 },
//     // ... mais dados conforme necessário
// ];

// const margin = { top: 20, right: 30, bottom: 40, left: 90 },
//     width = 960 - margin.left - margin.right,
//     height = 500 - margin.top - margin.bottom,
//     duration = 2500;

// const svg = d3
//     .select("body")
//     .append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// const x = d3.scaleLinear().range([0, width]);
// const y = d3.scaleBand().range([height, 0]).padding(0.1);

// function update(data) {
//     x.domain([0, d3.max(data, d => d.value)]);
//     y.domain(
//         data2
//             .sort((a, b) => b.value - a.value)
//             .map(d => d.name)
//     );

//     const bars = svg.selectAll(".bar").data(data, d => d.name);

//     bars
//         .enter()
//         .append("rect")
//         .attr("class", "bar")
//         .attr("y", d => y(d.name))
//         .attr("height", y.bandwidth())
//         .transition()
//         .duration(duration)
//         .attr("x", d => x(d.lastValue))
//         .attr("width", d => x(d.value) - x(d.lastValue));

//     bars
//         .transition()
//         .duration(duration)
//         .attr("y", d => y(d.name))
//         .attr("x", d => x(d.lastValue))
//         .attr("width", d => x(d.value) - x(d.lastValue));

//     bars
//         .exit()
//         .transition()
//         .duration(duration)
//         .attr("width", d => x(d.lastValue))
//         .remove();
// }

// // // Atualize os dados conforme necessário
// update(data2);

// ================================================


// ================================================
// var barChartSVG = d3.select("body").append("svg")
//     .attr("width", 960)
//     .attr("height", 600);

// var tickDuration = 500;

// var top_n = 12;
// var height = 600;
// var width = 960;

// const margin = {
//     top: 80,
//     right: 0,
//     bottom: 5,
//     left: 0
// };

// let barPadding = (height - (margin.bottom + margin.top)) / (top_n * 5);

// let title = barChartSVG.append('text')
//     .attr('class', 'title')
//     .attr('y', 24)
//     .html('18 years of Interbrand’s Top Global Brands');

// let subTitle = barChartSVG.append("text")
//     .attr("class", "subTitle")
//     .attr("y", 55)
//     .html("Brand value, $m");

// let caption = barChartSVG.append('text')
//     .attr('class', 'caption')
//     .attr('x', width)
//     .attr('y', height - 5)
//     .style('text-anchor', 'end')
//     .html('Source: Interbrand');

// let year = 2000;

// const data = nodeToSummary;

// console.log(data);

// data.forEach(d => {
//     d.value = +d.value,
//         d.lastValue = +d.lastValue,
//         d.value = isNaN(d.value) ? 0 : d.value,
//         d.year = +d.year,
//         d.colour = d3.hsl(Math.random() * 360, 0.75, 0.75)
// });

// console.log(data);

// let yearSlice = data.filter(d => d.year == year && !isNaN(d.value))
//     .sort((a, b) => b.value - a.value)
//     .slice(0, top_n);

// yearSlice.forEach((d, i) => d.rank = i);

// console.log('yearSlice: ', yearSlice)

// let x = d3.scaleLinear()
//     .domain([0, d3.max(yearSlice, d => d.value)])
//     .range([margin.left, width - margin.right - 65]);

// let y = d3.scaleLinear()
//     .domain([top_n, 0])
//     .range([height - margin.bottom, margin.top]);

// let xAxis = d3.axisTop()
//     .scale(x)
//     .ticks(width > 500 ? 5 : 2)
//     .tickSize(-(height - margin.top - margin.bottom))
//     .tickFormat(d => d3.format(',')(d));

// barChartSVG.append('g')
//     .attr('class', 'axis xAxis')
//     .attr('transform', `translate(0, ${margin.top})`)
//     .call(xAxis)
//     .selectAll('.tick line')
//     .classed('origin', d => d == 0);

// barChartSVG.selectAll('rect.bar')
//     .data(yearSlice, d => d.name)
//     .enter()
//     .append('rect')
//     .attr('class', 'bar')
//     .attr('x', x(0) + 1)
//     .attr('width', d => x(d.value) - x(0) - 1)
//     .attr('y', d => y(d.rank) + 5)
//     .attr('height', y(1) - y(0) - barPadding)
//     .style('fill', d => d.colour);

// barChartSVG.selectAll('text.label')
//     .data(yearSlice, d => d.name)
//     .enter()
//     .append('text')
//     .attr('class', 'label')
//     .attr('x', d => x(d.value) - 8)
//     .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1)
//     .style('text-anchor', 'end')
//     .html(d => d.name);

// barChartSVG.selectAll('text.valueLabel')
//     .data(yearSlice, d => d.name)
//     .enter()
//     .append('text')
//     .attr('class', 'valueLabel')
//     .attr('x', d => x(d.value) + 5)
//     .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1)
//     .text(d => d3.format(',.0f')(d.lastValue));

// let yearText = barChartSVG.append('text')
//     .attr('class', 'yearText')
//     .attr('x', width - margin.right)
//     .attr('y', height - 25)
//     .style('text-anchor', 'end')
//     .html(~~year);
// //.call(halo, 10);

// let ticker = d3.interval(e => {

//     yearSlice = data.filter(d => d.year == year && !isNaN(d.value))
//         .sort((a, b) => b.value - a.value)
//         .slice(0, top_n);

//     yearSlice.forEach((d, i) => d.rank = i);

//     //console.log('IntervalYear: ', yearSlice);

//     x.domain([0, d3.max(yearSlice, d => d.value)]);

//     barChartSVG.select('.xAxis')
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .call(xAxis);

//     let bars = barChartSVG.selectAll('.bar').data(yearSlice, d => d.name);

//     bars
//         .enter()
//         .append('rect')
//         .attr('class', d => `bar ${d.name.replace(/\s/g, '_')}`)
//         .attr('x', x(0) + 1)
//         .attr('width', d => x(d.value) - x(0) - 1)
//         .attr('y', d => y(top_n + 1) + 5)
//         .attr('height', y(1) - y(0) - barPadding)
//         .style('fill', d => d.colour)
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .attr('y', d => y(d.rank) + 5);

//     bars
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .attr('width', d => x(d.value) - x(0) - 1)
//         .attr('y', d => y(d.rank) + 5);

//     bars
//         .exit()
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .attr('width', d => x(d.value) - x(0) - 1)
//         .attr('y', d => y(top_n + 1) + 5)
//         .remove();

//     let labels = barChartSVG.selectAll('.label')
//         .data(yearSlice, d => d.name);

//     labels
//         .enter()
//         .append('text')
//         .attr('class', 'label')
//         .attr('x', d => x(d.value) - 8)
//         .attr('y', d => y(top_n + 1) + 5 + ((y(1) - y(0)) / 2))
//         .style('text-anchor', 'end')
//         .html(d => d.name)
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1);


//     labels
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .attr('x', d => x(d.value) - 8)
//         .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1);

//     labels
//         .exit()
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .attr('x', d => x(d.value) - 8)
//         .attr('y', d => y(top_n + 1) + 5)
//         .remove();



//     let valueLabels = barChartSVG.selectAll('.valueLabel').data(yearSlice, d => d.name);

//     valueLabels
//         .enter()
//         .append('text')
//         .attr('class', 'valueLabel')
//         .attr('x', d => x(d.value) + 5)
//         .attr('y', d => y(top_n + 1) + 5)
//         .text(d => d3.format(',.0f')(d.lastValue))
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1);

//     valueLabels
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .attr('x', d => x(d.value) + 5)
//         .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1)
//         .tween("text", function (d) {
//             let i = d3.interpolateRound(d.lastValue, d.value);
//             return function (t) {
//                 this.textContent = d3.format(',')(i(t));
//             };
//         });


//     valueLabels
//         .exit()
//         .transition()
//         .duration(tickDuration)
//         .ease(d3.easeLinear)
//         .attr('x', d => x(d.value) + 5)
//         .attr('y', d => y(top_n + 1) + 5)
//         .remove();

//     yearText.html(~~year);

//     if (year == 2001) ticker.stop();
//     year = d3.format('.1f')((+year) + 0.1);
// }, tickDuration);

// const halo = function (text, strokeWidth) {
//     text.select(function () { return this.parentNode.insertBefore(this.cloneNode(true), this); })
//         .style('fill', '#ffffff')
//         .style('stroke', '#ffffff')
//         .style('stroke-width', strokeWidth)
//         .style('stroke-linejoin', 'round')
//         .style('opacity', 1);
// }



// ================================================




/* 
=============================
Execute!
=============================
*/
initializePeriodicCheckButtonControls();
initializeProjectList();
initializeBarGraph(nodeToSummary);
