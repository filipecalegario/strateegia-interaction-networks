/**
 * Login Module
 * Entry point for the login page
 */

import { initializeLogin } from "./core/auth.js";

// Initialize login functionality when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    initializeLogin();
}); 