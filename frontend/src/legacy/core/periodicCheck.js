/**
 * Periodic Check Module
 * Handles periodic data updates
 */

import * as d3 from "d3";
import { gatherGraphData } from "../data/graphData.js";
import { updateGraphData, applyFilters, getFilters } from "../data/dataManager.js";
import { updateStatusDisplay } from "../ui/uiManager.js";

// Interval check state
let intervalCheck = "inactive";
let nodeToSummary = [];
let isRunning = false;

/**
 * Start periodic check
 * @param {string} accessToken - The access token
 * @param {string} selectedProject - The selected project ID
 * @param {string} selectedMode - The selected visualization mode
 * @param {Function} onDataUpdate - Callback for data update
 */
export function startPeriodicCheck(accessToken, selectedProject, selectedMode, onDataUpdate) {
    let button = d3.select("#periodic-check-button");

    if (intervalCheck !== "inactive") {
        clearInterval(intervalCheck);
    }

    const chosenInterval = Number(d3.select("#intervals").property("value")) || 60000;

    const runPeriodicUpdate = () => {
        const projectToCheck = localStorage.getItem("selectedProject") || selectedProject;
        const modeToCheck = localStorage.getItem("selectedMode") || selectedMode;
        periodicCheck(accessToken, projectToCheck, modeToCheck, onDataUpdate);
    };

    // Run an update immediately so the UI reflects the latest data
    runPeriodicUpdate();
    intervalCheck = setInterval(runPeriodicUpdate, chosenInterval);

    button.text("parar atualização automática");
    button.classed("btn-outline-success", false);
    button.classed("btn-outline-danger", true);

    d3.select("#periodic-check-status")
        .classed("alert alert-secondary", true)
        .text("auto atualização ativa");
}

/**
 * Stop periodic check
 */
export function stopPeriodicCheck() {
    let button = d3.select("#periodic-check-button");
    clearInterval(intervalCheck);
    intervalCheck = "inactive";

    button.text("iniciar atualização automática");
    button.classed("btn-outline-success", true);
    button.classed("btn-outline-danger", false);

    d3.select("#periodic-check-status")
        .classed("alert alert-secondary", true)
        .text("auto atualização desativada");
}

/**
 * Get periodic check status
 * @returns {string} The periodic check status
 */
export function getPeriodicCheckStatus() {
    return intervalCheck;
}

/**
 * Perform periodic check
 * @param {string} accessToken - The access token
 * @param {string} selectedProject - The selected project ID
 * @param {string} selectedMode - The selected visualization mode
 * @param {Function} onDataUpdate - Callback for data update
 */
async function periodicCheck(accessToken, selectedProject, selectedMode, onDataUpdate) {
    if (isRunning) {
        console.warn("Skipping periodic check: previous run still in progress");
        return;
    }

    isRunning = true;
    console.log(`periodicCheck(): ${selectedProject}`);

    // Gather new data
    try {
        let justGatheredData = await gatherGraphData(
            accessToken,
            selectedProject,
            selectedMode
        );

        // Update data
        updateGraphData(justGatheredData);

        // Apply filters
        const filteredData = applyFilters(getFilters());

        // Call update callback
        onDataUpdate(filteredData);

        // Update status display
        updateStatusDisplay();

        console.log("nodes to summary %o", nodeToSummary);
    } finally {
        isRunning = false;
    }
}