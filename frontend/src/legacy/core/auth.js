/**
 * Authentication Module
 * Handles user authentication
 */

import { auth, getUser } from "https://unpkg.com/strateegia-api/strateegia-api.js";

/**
 * Initialize login functionality
 * @param {Function} [onLoginSuccess] Callback executed on successful login
 * @param {Object} [options]
 * @param {string} [options.locationSearch] Optional search string for determining selected mode
 * @returns {Function|undefined} Cleanup function
 */
export function initializeLogin(onLoginSuccess, options = {}) {
    const { locationSearch } = options;
    const btnLogin = document.getElementById("btnLogin");

    if (!btnLogin) {
        return undefined;
    }

    const handleLoginClick = async () => {
        console.log("btnLogin clicked");
        const usernameElement = document.getElementById("username");
        const passwordElement = document.getElementById("password");

        const queryString = locationSearch ?? window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const selectedMode = urlParams.get("mode") || "projeto";

        const username = usernameElement?.value ?? "";
        const password = passwordElement?.value ?? "";

        try {
            const token = await auth(username, password);
            console.log(token);
            localStorage.setItem("strateegiaAccessToken", token);
            if (typeof onLoginSuccess === "function") {
                onLoginSuccess(selectedMode);
            } else {
                window.location.href = `/main?mode=${selectedMode}`;
            }
        } catch (error) {
            console.error("Authentication failed:", error);
            alert("Authentication failed. Please check your credentials.");
        }
    };

    btnLogin.addEventListener("click", handleLoginClick);

    return () => {
        btnLogin.removeEventListener("click", handleLoginClick);
    };
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function checkAuthentication() {
    const accessToken = localStorage.getItem("strateegiaAccessToken");

    if (!accessToken || accessToken === "undefined") {
        console.log("No access token");
        return false;
    }

    try {
        const user = await getUser(accessToken);
        localStorage.setItem("userId", user.id);
        return true;
    } catch (error) {
        console.error("Authentication check failed:", error);
        return false;
    }
}

/**
 * Get current user
 * @returns {Promise<Object>} User object
 */
export async function getCurrentUser() {
    const accessToken = localStorage.getItem("strateegiaAccessToken");

    if (!accessToken || accessToken === "undefined") {
        throw new Error("No access token");
    }

    return getUser(accessToken);
}

/**
 * Logout user
 * @param {Function} [onLogout] Callback executed after clearing session data
 */
export function logout(onLogout) {
    localStorage.removeItem("strateegiaAccessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("selectedProject");
    localStorage.removeItem("selectedMode");

    if (typeof onLogout === "function") {
        onLogout();
    } else {
        window.location.href = "/";
    }
}
