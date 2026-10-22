import { Easing } from 'remotion';

/** The app's own palette (DESIGN.md, site-dime). */
export const C = {
  yellow: '#ffca49',
  yellowLine: '#e9c893',
  cream: '#fefaf4',
  paper: '#ffffff',
  surface: '#f6f2e9',
  ink: '#1c1c1c',
  muted: '#5c5c5c',
  line: '#d3c9bc',
  rule: '#91867b',
  mint: '#c7e9cc',
  pink: '#f8b7c7',
} as const;

export const DISPLAY = 'Satoshi, Inter, sans-serif';
export const BODY = 'Inter, sans-serif';
export const MONO = '"JetBrains Mono", ui-monospace, monospace';

/** The app's paper curve: fast out, soft landing. */
export const paper = Easing.bezier(0.16, 1, 0.3, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);

export const W = 1920;
export const H = 1080;
/** The flat yellow field the phone stands on, as on the app's wide-screen layout. */
export const FIELD_X = 1010;
