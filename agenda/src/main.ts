import "missing.css";
import { renderAgenda } from "./agenda.js";

const app = document.querySelector("#app");
if (!app) throw new Error("#app element not found");

app.appendChild(renderAgenda());
