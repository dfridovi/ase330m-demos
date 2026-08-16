// Dark-theme chart tokens (this app is dark-only, sized for classroom projection),
// values from the dataviz skill's reference palette (dark surface #1a1a19).
export const CHART_SURFACE = '#1a1a19';
export const TEXT_PRIMARY = '#ffffff';
export const TEXT_SECONDARY = '#c3c2b7';
export const TEXT_MUTED = '#898781';
export const GRIDLINE = '#2c2c2a';
export const AXIS = '#383835';

export const SERIES_DISPLACEMENT = '#3987e5'; // x(t) trace, all time-domain tabs
export const SERIES_MAGNITUDE = '#3987e5'; // |X(omega)|
export const SERIES_PHASE = '#d95926'; // phi(omega)
// f(t) overlay on the time-domain tabs — reuses the phase color since the two are never
// shown together (phase only appears on the frequency tab, which has no force overlay).
export const SERIES_FORCE = '#d95926';

// Car-body canvas
export const CANVAS_GROUND = AXIS;
export const CANVAS_WHEEL = TEXT_MUTED;
export const CANVAS_BODY = '#3987e5';
export const CANVAS_SPRING = TEXT_SECONDARY;
export const CANVAS_DASHPOT = '#199e70';
export const CANVAS_FORCE = '#d95926';
