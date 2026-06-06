import "missing.css";
import { renderReminderList } from "./office-hours.js";
import { getDemoReminders } from "./data.js";

const app = document.querySelector("#app");
if (!app) throw new Error("#app element not found");

app.appendChild(renderReminderList(getDemoReminders(), new Date()));
