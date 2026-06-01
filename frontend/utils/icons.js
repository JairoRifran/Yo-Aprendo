const ICONS = {
  activity: '<path d="M22 12h4"/><path d="M24 10v4"/><path d="M5 17h3l3-9 5 18 3-9h3"/>',
  "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  "arrow-right": '<path d="m12 5 7 7-7 7"/><path d="M5 12h14"/>',
  badge: '<path d="M12 3 4 7v6c0 5 3.4 7.6 8 9 4.6-1.4 8-4 8-9V7l-8-4Z"/><path d="m9 12 2 2 4-4"/>',
  "bar-chart": '<path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-3"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4v15.5"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-4 2 2-6 4-2Z"/>',
  flag: '<path d="M5 22V4"/><path d="M5 4h12l-1 5 1 5H5"/>',
  gauge: '<path d="M4 14a8 8 0 0 1 16 0"/><path d="m14 10-4 4"/><path d="M3 18h18"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  "graduation-cap": '<path d="m22 10-10-5-10 5 10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 10v6"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.5 1.6-6A4.8 4.8 0 0 0 12 7a4.8 4.8 0 0 0-8.6 1c-1.4 2.5.1 4.5 1.6 6l7 7 7-7Z"/>',
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  "lightbulb": '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.5 14A6 6 0 1 1 15.5 14c-1.1.8-1.5 1.7-1.5 3h-4c0-1.3-.4-2.2-1.5-3Z"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/>',
  panels: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/><path d="M3 10h18"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h4a4 4 0 0 0 0-8h-1a4 4 0 0 1 0-8h5"/>',
  school: '<path d="m4 10 8-6 8 6"/><path d="M6 9v11h12V9"/><path d="M10 20v-6h4v6"/><path d="M3 20h18"/>',
  settings: '<path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-2 .2 1.7 1.7 0 0 0-.8 1.6V22h-4v-.1a1.7 1.7 0 0 0-.8-1.6 1.7 1.7 0 0 0-2-.2l-.2.1-2-3.4.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1.1H4v-4h.2A1.7 1.7 0 0 0 5.7 8.7a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.4.2.1a1.7 1.7 0 0 0 2-.2A1.7 1.7 0 0 0 10.3 2h4a1.7 1.7 0 0 0 .8 1.3 1.7 1.7 0 0 0 2 .2l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1.1h.2v4h-.2a1.7 1.7 0 0 0-1.5 1.1Z"/>',
  shield: '<path d="M12 3 4 7v6c0 5 3.4 7.6 8 9 4.6-1.4 8-4 8-9V7l-8-4Z"/>',
  sparkles: '<path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
  "trending-up": '<path d="m3 17 6-6 4 4 7-8"/><path d="M14 7h6v6"/>',
  trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 7H4a3 3 0 0 0 3 3"/><path d="M17 7h3a3 3 0 0 1-3 3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<path d="M16 21a6 6 0 0 0-12 0"/><circle cx="10" cy="8" r="4"/><path d="M22 21a5 5 0 0 0-5-5"/><path d="M16 4a4 4 0 0 1 0 8"/>'
};

const ALIASES = {
  active: "activity",
  family: "heart",
  groups: "users",
  institution: "school",
  mission: "compass",
  parent: "heart",
  progress: "trending-up",
  roster: "book",
  spark: "sparkles",
  student: "user",
  students: "users",
  support: "check",
  teacher: "monitor",
  today: "activity",
  timer: "clock"
};

export function uiIcon(name, className = "ui-icon") {
  const key = ALIASES[name] || name;
  const body = ICONS[key] || ICONS.sparkles;
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}
