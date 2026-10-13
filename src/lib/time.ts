// All days and wall-clock times in SlotSync use one organisation time zone, so "9:00 in the Boardroom"
// means the same thing for everyone. The database stores exact instants (timestamptz, UTC).
export const APP_TIME_ZONE = process.env.APP_TIME_ZONE ?? "Asia/Colombo";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// How far the zone's wall clock is ahead of UTC at a given instant, in ms.
function zoneOffset(instant: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(instant).map((p) => [p.type, Number(p.value)]));
  const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return wallAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// "2026-10-13" + "09:30" on the organisation's clock -> the exact instant.
export function zonedToInstant(dateKey: string, time = "00:00") {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, h, min);
  // Correct once more in case the first guess landed on the other side of a DST change.
  const first = wall - zoneOffset(new Date(wall));
  return new Date(wall - zoneOffset(new Date(first)));
}

// Exact instant -> "2026-10-13" on the organisation's clock.
export function toDateKey(instant: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(instant);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDays(dateKey: string, days: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// True for real calendar dates only ("2026-02-30" is false).
export function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && addDays(value, 0) === value;
}

// The day as a half-open range [start, end): midnight to the next midnight.
export function dayRange(dateKey: string) {
  return { start: zonedToInstant(dateKey), end: zonedToInstant(addDays(dateKey, 1)) };
}

export function formatTime(instant: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(instant);
}

export function formatDateKey(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

// Exact instant -> "2026-10-13T09:30", the format a datetime-local input expects.
export function toInputValue(instant: Date) {
  return `${toDateKey(instant)}T${formatTime(instant)}`;
}
