import { createAppConfig } from "@commons-systems/config/vite";
import { agendaSeedDataPlugin } from "./src/vite-plugin-seed-data";

export default createAppConfig({ plugins: [agendaSeedDataPlugin()] });
