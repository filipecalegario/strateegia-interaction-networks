import { getUser } from "https://unpkg.com/strateegia-api/strateegia-api.js";
import { saveJson, saveAsSVG } from "./visualProjects.js";

// Expose functions to the global scope for HTML button access
window.saveJson = saveJson;
window.saveAsSVG = saveAsSVG;

const accessToken = localStorage.getItem("strateegiaAccessToken");

if (accessToken == 'undefined') {
    console.log("No access token");
    window.alert("Authentication failed: No access token");
} else {
    console.log(accessToken);
    getUser(accessToken).then((user) => {
        localStorage.setItem("userId", user.id);
    });
}

const botao = d3.select("#main-button");
botao.on("click", () => {
    console.log("clicked");
});




