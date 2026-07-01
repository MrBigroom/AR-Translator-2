/** Central design tokens for Gift for CY (dark, camera-friendly palette). */
export const colors = {
  background: '#0B0F19',
  panel: '#121826',
  panelBorder: '#1F2937',
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  accent: '#6EE7B7',
  accentDim: '#34D399',
  danger: '#F87171',
  overlay: 'rgba(11, 15, 25, 0.7)',
  chip: '#1E293B',
  chipActive: '#334155',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
};

/** Camera occupies the top ~75%, translation panel the bottom ~25%. */
export const CAMERA_FLEX = 0.75;
export const PANEL_FLEX = 0.25;
