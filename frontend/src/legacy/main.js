/**
 * Main Module
 * Entry point for the application
 */

import * as d3 from "d3";
import { USER_MODE, PROJECT_MODE, INDICATORS_MODE, BEESWARM_MODE, DEFAULT_MODE } from "./core/config.js";
import { initializeRenderer } from "./visualization/graphRenderer.js";
import {
    initializeUI,
    initializeProjectList,
    initializeModeSelector,
    initializePeriodicCheckButtonControls,
} from "./ui/uiManager.js";
import { getProjects, drawProject, updateGraph } from "./core/projectManager.js";
import { startPeriodicCheck, stopPeriodicCheck, getPeriodicCheckStatus } from "./core/periodicCheck.js";
import { checkAuthentication } from "./core/auth.js";

/**
 * Initialize the application
 * @param {Object} [options]
 * @param {Function} [options.onUnauthenticated] Callback executed when authentication fails
 * @param {string} [options.locationSearch] Optional location search string
 * @returns {Function|undefined} Cleanup function
 */
export async function initializeApp(options = {}) {
    const { onUnauthenticated, locationSearch, autoUpdate = true } = options;

    console.log("Initializing application...");

    const queryString = locationSearch ?? window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const selectedMode = urlParams.get("mode") || DEFAULT_MODE;
    localStorage.setItem("selectedMode", selectedMode);

    // Check authentication
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
        console.error("Authentication failed: No valid access token");
        if (typeof onUnauthenticated === "function") {
            onUnauthenticated();
        } else {
            window.location.href = "/";
        }
        return undefined;
    }

    // Get access token
    const accessToken = localStorage.getItem("strateegiaAccessToken");

    // Initialize renderer
    initializeRenderer("svg#main_svg", "#project-chooser");

    // Initialize UI
    initializeUI();
    initializePeriodicCheckButtonControls();

    const periodicButton = d3.select("#periodic-check-button");

    const handlePeriodicCheckClick = () => {
        if (getPeriodicCheckStatus() === "inactive") {
            const selectedProject = localStorage.getItem("selectedProject");
            const currentMode = localStorage.getItem("selectedMode") || DEFAULT_MODE;
            startPeriodicCheck(accessToken, selectedProject, currentMode, updateGraph);
        } else {
            stopPeriodicCheck();
        }
    };

    // Initialize periodic check button
    periodicButton.on("click", handlePeriodicCheckClick);

    // Get projects
    const projects = await getProjects(accessToken);
    console.log("projects", projects);

    // Initialize project list
    initializeProjectList(projects, async (selectedProject) => {
        const currentMode = localStorage.getItem("selectedMode") || DEFAULT_MODE;
        await drawProject(accessToken, selectedProject, currentMode);

        if (getPeriodicCheckStatus() !== "inactive") {
            stopPeriodicCheck();
            const latestProject = localStorage.getItem("selectedProject") || selectedProject;
            const latestMode = localStorage.getItem("selectedMode") || currentMode;
            startPeriodicCheck(accessToken, latestProject, latestMode, updateGraph);
        }
    });

    // Initialize mode selector
    const modes = [BEESWARM_MODE, PROJECT_MODE, USER_MODE, INDICATORS_MODE];
    initializeModeSelector(modes, async (mode) => {
        localStorage.setItem("selectedMode", mode);
        const selectedProject = localStorage.getItem("selectedProject");
        await drawProject(accessToken, selectedProject, mode);

        if (getPeriodicCheckStatus() !== "inactive") {
            stopPeriodicCheck();
            const latestProject = localStorage.getItem("selectedProject") || selectedProject;
            const latestMode = localStorage.getItem("selectedMode") || mode;
            startPeriodicCheck(accessToken, latestProject, latestMode, updateGraph);
        }
    });

    // Draw initial project
    const defaultSelectedProject = projects[0]?.id;
    if (defaultSelectedProject) {
        localStorage.setItem("selectedProject", defaultSelectedProject);
        d3.select("#project-link").attr("href", `https://app.strateegia.digital/journey/${defaultSelectedProject}`);
        await drawProject(accessToken, defaultSelectedProject, selectedMode);

        if (autoUpdate && getPeriodicCheckStatus() === "inactive") {
            const latestMode = localStorage.getItem("selectedMode") || selectedMode;
            startPeriodicCheck(accessToken, defaultSelectedProject, latestMode, updateGraph);
        }
    }

    return () => {
        periodicButton.on("click", null);
    };
}

export default initializeApp;
