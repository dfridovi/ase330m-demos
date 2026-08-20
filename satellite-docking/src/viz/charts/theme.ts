// Dark-theme chart tokens (this app is dark-only, sized for classroom projection), same values
// as cw-dynamics/flight-control's theme.ts (the dataviz skill's reference palette).
export const CHART_SURFACE = '#1a1a19';
export const TEXT_PRIMARY = '#ffffff';
export const TEXT_SECONDARY = '#c3c2b7';
export const TEXT_MUTED = '#898781';
export const GRIDLINE = '#2c2c2a';
export const AXIS = '#383835';
export const ACCENT = '#3987e5';
export const DANGER = '#d95926';

export const SERIES_CURRENT = '#ffffff'; // the student's own K
// Gold, not orange -- distinct from both DANGER/BURN_ARROW's orange-red (a "wasteful" gain and
// a live thrust vector are conceptually unrelated, and used side by side, so a naive gain that
// shared DANGER's exact hex was reading as "the same series" as the capture-threshold line and
// the burn arrow).
export const SERIES_NAIVE = '#e8c14d'; // naive reference gain (gold -- "the wasteful one")
export const SERIES_TUNED = '#199e70'; // tuned reference gain (green -- "the efficient one")
export const SERIES_OPEN_LOOP = '#5b5a56'; // uncontrolled (u=0) reference -- dim, background-ish
export const CAPTURE_RING = '#3987e5'; // capture-threshold circle/sphere
export const BURN_ARROW = '#ff6a3d'; // thrust vector -- brighter than DANGER's orange so it reads as "live", not "a reference line"
