import type { DataSource } from "./data-source.js";

let activeDataSource: DataSource | null = null;

export function setActiveDataSource(ds: DataSource): void {
  activeDataSource = ds;
}

export function getActiveDataSource(): DataSource {
  if (!activeDataSource) throw new Error("No active data source. Upload a data file or wait for seed data to load.");
  return activeDataSource;
}
