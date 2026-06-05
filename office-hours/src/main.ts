import "missing.css";
import { renderOfficeHours } from "./office-hours.js";

const app = document.querySelector("#app");
if (!app) throw new Error("#app element not found");

app.appendChild(renderOfficeHours());
