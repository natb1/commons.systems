import { type UsageSample } from "./usage-samples.js";

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/**
 * Returns the sample with the maximum sampledAt, or null for an empty array.
 * Does not mutate the input array.
 */
export function selectLatestSample(samples: UsageSample[]): UsageSample | null {
  if (samples.length === 0) return null;
  return samples.reduce((best, s) =>
    s.sampledAt.getTime() > best.sampledAt.getTime() ? s : best,
  );
}

function workerState(active: number, target: number): string {
  if (target === 0) return "paused";
  if (active < target) return "spawning";
  return "steady";
}

function formatCountdown(resetAt: Date, now: Date): string {
  const delta = resetAt.getTime() - now.getTime();
  if (delta < MINUTE) return "now";
  if (delta >= DAY) {
    const d = Math.floor(delta / DAY);
    const h = Math.floor((delta % DAY) / HOUR);
    return `in ${d}d ${h}h`;
  }
  if (delta >= HOUR) {
    const h = Math.floor(delta / HOUR);
    const m = Math.floor((delta % HOUR) / MINUTE);
    return `in ${h}h ${m}m`;
  }
  const m = Math.floor(delta / MINUTE);
  return `in ${m}m`;
}

function formatResetClock(resetAt: Date, now: Date): string {
  const timeStr = resetAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (
    resetAt.getFullYear() === now.getFullYear() &&
    resetAt.getMonth() === now.getMonth() &&
    resetAt.getDate() === now.getDate()
  ) {
    return timeStr;
  }
  const dayStr = resetAt.toLocaleDateString([], { weekday: "short" });
  return `${dayStr} ${timeStr}`;
}

function buildResetItem(label: string, resetAt: Date, now: Date): HTMLElement {
  const li = document.createElement("li");

  const labelSpan = document.createElement("span");
  labelSpan.className = "capacity-reset-label";
  labelSpan.textContent = label;

  const clockSpan = document.createElement("span");
  clockSpan.className = "capacity-reset-clock";
  clockSpan.textContent = formatResetClock(resetAt, now);

  const countdownSpan = document.createElement("span");
  countdownSpan.className = "capacity-reset-countdown";
  countdownSpan.textContent = formatCountdown(resetAt, now);

  li.appendChild(labelSpan);
  li.appendChild(clockSpan);
  li.appendChild(countdownSpan);

  return li;
}

/**
 * Renders the capacity status band from the latest usage sample.
 */
export function renderCapacityBand(sample: UsageSample | null, now: Date): HTMLElement {
  const section = document.createElement("section");

  const heading = document.createElement("h2");
  heading.className = "capacity-heading";
  heading.textContent = "CAPACITY";
  section.appendChild(heading);

  if (sample === null) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No capacity data.";
    section.appendChild(empty);
    return section;
  }

  // Cards
  const cards = document.createElement("div");
  cards.className = "capacity-cards";

  const fiveHourCard = document.createElement("div");
  fiveHourCard.className = "capacity-card";
  const fiveHourLabel = document.createElement("span");
  fiveHourLabel.className = "capacity-card-label";
  fiveHourLabel.textContent = "5-hour";
  const fiveHourValue = document.createElement("span");
  fiveHourValue.className = "capacity-card-value";
  fiveHourValue.textContent = `${Math.round(sample.fiveHourUsedPct)}%`;
  fiveHourCard.appendChild(fiveHourLabel);
  fiveHourCard.appendChild(fiveHourValue);

  const weeklyCard = document.createElement("div");
  weeklyCard.className = "capacity-card";
  const weeklyLabel = document.createElement("span");
  weeklyLabel.className = "capacity-card-label";
  weeklyLabel.textContent = "weekly";
  const weeklyValue = document.createElement("span");
  weeklyValue.className = "capacity-card-value";
  weeklyValue.textContent = `${Math.round(sample.weeklyUsedPct)}%`;
  weeklyCard.appendChild(weeklyLabel);
  weeklyCard.appendChild(weeklyValue);

  cards.appendChild(fiveHourCard);
  cards.appendChild(weeklyCard);
  section.appendChild(cards);

  // Resets
  const resets = document.createElement("ul");
  resets.className = "capacity-resets";
  resets.appendChild(buildResetItem("5-hour", sample.fiveHourResetsAt, now));
  resets.appendChild(buildResetItem("weekly", sample.weeklyResetsAt, now));
  section.appendChild(resets);

  // Worker verdict
  const workers = document.createElement("p");
  workers.className = "capacity-workers";
  workers.appendChild(
    document.createTextNode(`${sample.activeWorkers} active / ${sample.targetWorkers} target `),
  );
  const state = workerState(sample.activeWorkers, sample.targetWorkers);
  const stateSpan = document.createElement("span");
  stateSpan.className = "capacity-worker-state";
  stateSpan.classList.add(state);
  stateSpan.textContent = state;
  workers.appendChild(stateSpan);
  section.appendChild(workers);

  return section;
}
