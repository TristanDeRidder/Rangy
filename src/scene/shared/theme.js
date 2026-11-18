/** Kleuren uit het ontwerp (Figma, sectie Design). Gedeeld door 3D, SVG en 2D. */
export const COLORS = {
  ink: '#141414',
  muted: '#555555',
  road: '#26292C',
  reach: '#1DBF73', // haalbaar
  margin: '#F5C518', // hangt ervan af
  charge: '#FF7A3D', // laadstop nodig
  car: '#FFFFFF',
  carGlass: '#1E2328',
  ground: '#E4EAEE',
};

export const STATUS_COLOR = {
  haalbaar: COLORS.reach,
  marge: COLORS.margin,
  laadstop: COLORS.charge,
};

export const STATUS_LABEL = {
  haalbaar: 'Haalbaar',
  marge: 'Hangt ervan af',
  laadstop: 'Laadstop nodig',
};
