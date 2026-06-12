// ─── Constants ───────────────────────────────────────────────────────────────
export const TEAM = [
  { id: "alice", name: "Alice", color: "#6366F1", initials: "AL" },
  { id: "bob", name: "Bob", color: "#10B981", initials: "BO" },
  { id: "charlie", name: "Charlie", color: "#F59E0B", initials: "CH" },
  { id: "diana", name: "Diana", color: "#F43F5E", initials: "DI" },
];

export const STATUSES = ["pending", "approved", "rejected"];
export const STORAGE_KEY = "leave_calendar_v1";

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function pad(n) {
  return String(n).padStart(2, "0");
}
export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function fromISO(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(s) {
  return fromISO(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
export function formatDateShort(s) {
  return fromISO(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dateRange(startISO, endISO) {
  const dates = [];
  const cur = fromISO(startISO);
  const end = fromISO(endISO);
  while (cur <= end) {
    dates.push(toISO(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function datesOverlap(s1, e1, s2, e2) {
  return s1 <= e2 && e1 >= s2;
}

// On-call helpers
export const ONCALL_ANCHOR = new Date(2024, 0, 1);

export function getWeekIndex(date) {
  const monday = new Date(date);
  const day = date.getDay();
  monday.setDate(date.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return Math.round((monday - ONCALL_ANCHOR) / 86400000 / 7);
}

export function getOnCallForWeek(wi) {
  return TEAM[((wi % TEAM.length) + TEAM.length) % TEAM.length];
}

export function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}
export function getWeekSunday(date) {
  const mon = getWeekMonday(date);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return sun;
}
export function getOnCallForDate(date) {
  return getOnCallForWeek(getWeekIndex(date));
}

// Default sample leaves
export function defaultLeaves() {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = (offset) => {
    const dt = new Date(y, m, today.getDate() + offset);
    return toISO(dt);
  };
  return [
    {
      id: "l1",
      memberId: "alice",
      start: d(2),
      end: d(4),
      reason: "Annual holiday",
      status: "approved",
    },
    {
      id: "l2",
      memberId: "bob",
      start: d(7),
      end: d(9),
      reason: "Medical appointment",
      status: "pending",
    },
    {
      id: "l3",
      memberId: "charlie",
      start: d(12),
      end: d(13),
      reason: "Family event",
      status: "approved",
    },
  ];
}

export function loadLeaves() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultLeaves();
  } catch {
    return defaultLeaves();
  }
}
export function saveLeaves(leaves) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leaves));
}
