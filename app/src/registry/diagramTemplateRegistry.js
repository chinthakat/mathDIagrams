// Data-driven template registry.
// Each entry defines: metadata, default canvas objects, config schema (drives the UI),
// and question hints (sent to Claude for MCQ generation).
// To add a new template, just add a new object here — no React code changes needed.

export const DIAGRAM_TEMPLATES = [
  // ─── GEOMETRY ────────────────────────────────────────────────
  {
    id: 'right_triangle',
    name: 'Right-Angled Triangle',
    category: 'Geometry',
    yearLevels: [4, 5, 6, 7, 8],
    description: 'For Pythagoras theorem, trigonometric ratios, and side/angle calculations.',
    thumbnail: '/samples/right_triangle.png',
    objects: (cfg) => [
      { type: 'rightTriangle', x: 400, y: 300, base: cfg.base * 20, height: cfg.height * 20, fill: 'rgba(59,130,246,0.15)', stroke: '#3b82f6', strokeWidth: 2 },
      { type: 'text', x: 400 + (cfg.base * 20) / 2, y: 315, text: cfg.labelB, fontSize: 14, fill: '#cbd5e1' },
      { type: 'text', x: 380, y: 300 - (cfg.height * 20) / 2, text: cfg.labelA, fontSize: 14, fill: '#cbd5e1' },
      { type: 'text', x: 420 + (cfg.base * 20) / 4, y: 300 - (cfg.height * 20) / 2.2, text: cfg.labelC, fontSize: 14, fill: '#cbd5e1' },
    ],
    configSchema: [
      { key: 'base',   label: 'Base (cm)',   type: 'number', min: 3, max: 15, default: 8 },
      { key: 'height', label: 'Height (cm)', type: 'number', min: 3, max: 15, default: 6 },
      { key: 'labelA', label: 'Vertical side', type: 'text', default: 'a' },
      { key: 'labelB', label: 'Base label',    type: 'text', default: 'b' },
      { key: 'labelC', label: 'Hypotenuse',    type: 'text', default: 'c' },
    ],
    questionHints: { type: 'pythagoras', variables: ['base', 'height'], answerVariable: 'hypotenuse' },
  },

  {
    id: 'isosceles_triangle',
    name: 'Isosceles Triangle',
    category: 'Geometry',
    yearLevels: [4, 5, 6, 7],
    description: 'Angle sum properties, equal sides, vertex angle problems.',
    thumbnail: '/samples/standard_triangle.png',
    objects: (cfg) => [
      { type: 'isoscelesTriangle', x: 400, y: 290, base: cfg.base * 20, height: cfg.height * 20, fill: 'rgba(16,185,129,0.15)', stroke: '#10b981', strokeWidth: 2 },
      { type: 'angleMarker', x: 400 - (cfg.base * 20) / 2 + 12, y: 290 + (cfg.height * 20) / 2 - 10, radius: 22, angle: cfg.baseAngle, stroke: '#ef4444', label: `${cfg.baseAngle}°` },
      { type: 'text', x: 397, y: 290 - (cfg.height * 20) / 2 - 20, text: cfg.topLabel, fontSize: 14, fontStyle: 'bold', fill: '#cbd5e1' },
    ],
    configSchema: [
      { key: 'base',      label: 'Base (cm)',      type: 'number', min: 4, max: 15, default: 9 },
      { key: 'height',    label: 'Height (cm)',     type: 'number', min: 4, max: 15, default: 7 },
      { key: 'baseAngle', label: 'Base angle (°)',  type: 'number', min: 20, max: 80, default: 55 },
      { key: 'topLabel',  label: 'Top vertex label', type: 'text', default: 'A' },
    ],
    questionHints: { type: 'angle_sum', variables: ['baseAngle'], answerVariable: 'apexAngle' },
  },

  {
    id: 'trapezium',
    name: 'Trapezium Area',
    category: 'Geometry',
    yearLevels: [5, 6, 7, 8],
    description: 'Parallel sides, height, area formula problems.',
    thumbnail: '/samples/trapezium.png',
    objects: (cfg) => [
      { type: 'polygon', x: 400, y: 300, sides: 4, radius: cfg.size, fill: 'rgba(245,158,11,0.15)', stroke: '#f59e0b', strokeWidth: 2, rotation: 45 },
      { type: 'line', x: 400 - cfg.size / 2, y: 300 - cfg.size / 2, length: cfg.size, stroke: '#94a3b8', strokeWidth: 1.5, rotation: 90, dash: [4, 4] },
      { type: 'text', x: 400 - cfg.size / 2 - 55, y: 300, text: cfg.heightLabel, fontSize: 14, fill: '#cbd5e1' },
      { type: 'text', x: 400, y: 300 + cfg.size / 2 + 20, text: cfg.baseLabel, fontSize: 14, fill: '#cbd5e1' },
    ],
    configSchema: [
      { key: 'size',        label: 'Size (px)',      type: 'number', min: 60, max: 150, default: 100 },
      { key: 'heightLabel', label: 'Height label',   type: 'text', default: 'h = 5 cm' },
      { key: 'baseLabel',   label: 'Base label',     type: 'text', default: 'b = 8 cm' },
    ],
    questionHints: { type: 'area_trapezium', variables: ['height', 'baseTop', 'baseBottom'], answerVariable: 'area' },
  },

  {
    id: 'annulus',
    name: 'Annulus (Ring)',
    category: 'Geometry',
    yearLevels: [6, 7, 8],
    description: 'Concentric circles, ring area, inner vs outer radius.',
    thumbnail: '/samples/annulus.png',
    objects: (cfg) => [
      { type: 'annulus', x: 400, y: 300, innerRadius: cfg.innerRadius, outerRadius: cfg.outerRadius, fill: 'rgba(236,72,153,0.2)', stroke: '#ec4899', strokeWidth: 2, showLabels: cfg.showLabels },
    ],
    configSchema: [
      { key: 'innerRadius', label: 'Inner radius (cm)', type: 'number', min: 2, max: 8, default: 3 },
      { key: 'outerRadius', label: 'Outer radius (cm)', type: 'number', min: 4, max: 15, default: 6 },
      { key: 'showLabels',  label: 'Show labels',       type: 'boolean', default: true },
    ],
    questionHints: { type: 'area_annulus', variables: ['innerRadius', 'outerRadius'], answerVariable: 'area' },
  },

  // ─── TRIGONOMETRY & NAVIGATION ──────────────────────────────
  {
    id: 'bearings',
    name: 'Bearings',
    category: 'Trigonometry & Navigation',
    yearLevels: [6, 7, 8],
    description: 'True North bearings, clockwise angles, navigation problems.',
    thumbnail: '/samples/bearings.png',
    objects: (cfg) => [
      { type: 'bearings', x: 400, y: 300, bearing: cfg.bearing, radius: cfg.radius, stroke: '#8b5cf6', strokeWidth: 2.5, label: `${cfg.bearing}°` },
    ],
    configSchema: [
      { key: 'bearing', label: 'Bearing angle (°)', type: 'number', min: 0, max: 359, default: 120 },
      { key: 'radius',  label: 'Arrow length (px)', type: 'number', min: 50, max: 140, default: 90 },
    ],
    questionHints: { type: 'bearings', variables: ['bearing'], answerVariable: 'backBearing' },
  },

  // ─── FRACTIONS ───────────────────────────────────────────────
  {
    id: 'fraction_circle',
    name: 'Fraction Circle',
    category: 'Fractions',
    yearLevels: [2, 3, 4, 5],
    description: 'Shaded sectors showing fractions of a circle.',
    thumbnail: '/samples/fraction_circle.png',
    objects: (cfg) => [
      { type: 'fractionCircle', x: 400, y: 300, radius: 100, sectors: cfg.denominator, shaded: cfg.numerator, fill: '#3b82f6', stroke: '#1e3a5f', strokeWidth: 2, rotation: 0 },
      { type: 'text', x: 400, y: 420, text: `${cfg.numerator}/${cfg.denominator}`, fontSize: 18, fill: '#cbd5e1', fontStyle: 'bold' },
    ],
    configSchema: [
      { key: 'numerator',   label: 'Shaded parts',  type: 'number', min: 1, max: 11, default: 3 },
      { key: 'denominator', label: 'Total parts',    type: 'number', min: 2, max: 12, default: 4 },
    ],
    questionHints: { type: 'fraction_identify', variables: ['numerator', 'denominator'], answerVariable: 'fraction' },
  },

  {
    id: 'fraction_rectangle',
    name: 'Fraction Rectangle',
    category: 'Fractions',
    yearLevels: [2, 3, 4, 5],
    description: 'Shaded columns/rows showing fractions of a rectangle.',
    thumbnail: '/samples/fraction_rectangle.png',
    objects: (cfg) => [
      { type: 'fractionRectangle', x: 400, y: 300, width: 280, height: 100, parts: cfg.denominator, shaded: cfg.numerator, fill: '#f59e0b', stroke: '#92400e', strokeWidth: 2 },
    ],
    configSchema: [
      { key: 'numerator',   label: 'Shaded parts', type: 'number', min: 1, max: 11, default: 2 },
      { key: 'denominator', label: 'Total parts',   type: 'number', min: 2, max: 12, default: 5 },
    ],
    questionHints: { type: 'fraction_identify', variables: ['numerator', 'denominator'], answerVariable: 'fraction' },
  },

  // ─── NUMBER LINES ────────────────────────────────────────────
  {
    id: 'number_line',
    name: 'Number Line',
    category: 'Number',
    yearLevels: [2, 3, 4, 5, 6],
    description: 'Integer or decimal number line for counting and ordering.',
    thumbnail: '/samples/number_line.png',
    objects: (cfg) => [
      { type: 'numberline', x: 400, y: 300, width: 420, min: cfg.min, max: cfg.max, step: cfg.step, isOpen: false, jumpCount: 0, jumpSize: cfg.step, labelMode: 'integer', stroke: '#94a3b8', strokeWidth: 3 },
    ],
    configSchema: [
      { key: 'min',  label: 'Start value', type: 'number', min: -20, max: 0,  default: 0 },
      { key: 'max',  label: 'End value',   type: 'number', min: 1,   max: 50, default: 10 },
      { key: 'step', label: 'Step size',   type: 'number', min: 1,   max: 5,  default: 1 },
    ],
    questionHints: { type: 'number_line_position', variables: ['min', 'max', 'step'], answerVariable: 'missingValue' },
  },

  // ─── GRAPHS & DATA ───────────────────────────────────────────
  {
    id: 'coordinate_plane',
    name: 'Coordinate Plane',
    category: 'Graphs & Data',
    yearLevels: [4, 5, 6, 7, 8],
    description: 'Cartesian plane for plotting points and graphing relations.',
    thumbnail: '/samples/coordinate_plane.png',
    objects: (cfg) => [
      { type: 'cartesianPlane', x: 400, y: 300, width: 320, height: 320, domain: cfg.domain, range: cfg.range, step: 1, showGrid: true, showLabels: true, stroke: '#334155', strokeWidth: 2, plots: [] },
    ],
    configSchema: [
      { key: 'domain', label: 'X axis range (±)', type: 'number', min: 3, max: 15, default: 5 },
      { key: 'range',  label: 'Y axis range (±)', type: 'number', min: 3, max: 15, default: 5 },
    ],
    questionHints: { type: 'coordinate_plotting', variables: ['domain', 'range'], answerVariable: 'coordinate' },
  },

  {
    id: 'bar_graph',
    name: 'Bar Graph',
    category: 'Graphs & Data',
    yearLevels: [3, 4, 5, 6],
    description: 'Vertical bar graph for data interpretation questions.',
    thumbnail: '/samples/bar_graph.png',
    objects: (cfg) => [
      {
        type: 'barGraph', x: 400, y: 300, width: 340, height: 220,
        bars: cfg.bars,
        showGrid: true, strokeWidth: 2,
      },
    ],
    configSchema: [
      {
        key: 'bars', label: 'Bar data', type: 'bars',
        default: [
          { label: 'Mon', value: 8,  color: '#3b82f6' },
          { label: 'Tue', value: 12, color: '#10b981' },
          { label: 'Wed', value: 5,  color: '#f59e0b' },
          { label: 'Thu', value: 15, color: '#8b5cf6' },
          { label: 'Fri', value: 10, color: '#ec4899' },
        ],
      },
    ],
    questionHints: { type: 'data_reading', variables: ['bars'], answerVariable: 'maxBar' },
  },

  // ─── PROBABILITY ─────────────────────────────────────────────
  {
    id: 'probability_spinner',
    name: 'Probability Spinner',
    category: 'Probability',
    yearLevels: [4, 5, 6, 7],
    description: 'Equal or unequal sectors for probability questions.',
    thumbnail: '/samples/probability_spinner.png',
    objects: (cfg) => [
      { type: 'spinner', x: 400, y: 300, radius: 100, sectors: cfg.sectors, stroke: '#1e293b', strokeWidth: 2, pointerAngle: 0, showPointer: cfg.showPointer },
    ],
    configSchema: [
      { key: 'sectors',     label: 'Number of sectors', type: 'number', min: 2, max: 12, default: 4 },
      { key: 'showPointer', label: 'Show pointer',       type: 'boolean', default: true },
    ],
    questionHints: { type: 'probability_fraction', variables: ['sectors'], answerVariable: 'probability' },
  },

  {
    id: 'venn_diagram',
    name: 'Venn Diagram',
    category: 'Probability',
    yearLevels: [5, 6, 7, 8],
    description: 'Two-set Venn diagram for set theory and probability.',
    thumbnail: null,
    objects: (cfg) => [
      { type: 'vennDiagram', x: 400, y: 300, radius: 110, overlapPercent: cfg.overlap, labelA: cfg.labelA, labelB: cfg.labelB, fillA: 'rgba(59,130,246,0.25)', fillB: 'rgba(236,72,153,0.25)', fillOverlap: 'rgba(139,92,246,0.3)' },
    ],
    configSchema: [
      { key: 'overlap', label: 'Overlap %',   type: 'number', min: 10, max: 60, default: 30 },
      { key: 'labelA',  label: 'Set A label', type: 'text', default: 'A' },
      { key: 'labelB',  label: 'Set B label', type: 'text', default: 'B' },
    ],
    questionHints: { type: 'set_theory', variables: ['setA', 'setB', 'intersection'], answerVariable: 'union' },
  },

  // ─── LOGIC ───────────────────────────────────────────────────
  {
    id: 'factor_tree',
    name: 'Prime Factor Tree',
    category: 'Number',
    yearLevels: [5, 6, 7],
    description: 'Break a number into its prime factors step by step.',
    thumbnail: '/samples/factor_tree.png',
    objects: (cfg) => [
      { type: 'factorTree', x: 400, y: 200, rootValue: cfg.rootValue, levelHeight: 55, initialSpread: 90, stroke: '#f43f5e', strokeWidth: 2 },
    ],
    configSchema: [
      { key: 'rootValue', label: 'Number to factorise', type: 'number', min: 4, max: 200, default: 48 },
    ],
    questionHints: { type: 'prime_factors', variables: ['rootValue'], answerVariable: 'primeFactors' },
  },

  // ─── MEASUREMENT ─────────────────────────────────────────────
  {
    id: 'ruler',
    name: 'Ruler / Length Measurement',
    category: 'Measurement',
    yearLevels: [2, 3, 4, 5],
    description: 'Measure length using a ruler diagram.',
    thumbnail: null,
    objects: (cfg) => [
      { type: 'ruler', x: 250, y: 300, width: cfg.width * 40, units: cfg.units, stroke: '#94a3b8', strokeWidth: 1.5 },
    ],
    configSchema: [
      { key: 'width', label: 'Length (cm)', type: 'number', min: 5, max: 20, default: 10 },
      { key: 'units', label: 'Units',       type: 'select', options: ['cm', 'mm', 'm'], default: 'cm' },
    ],
    questionHints: { type: 'length_measurement', variables: ['width', 'units'], answerVariable: 'length' },
  },
];

// Group templates by category for the browser UI
export function getTemplatesByCategory() {
  return DIAGRAM_TEMPLATES.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});
}

export function getTemplateById(id) {
  return DIAGRAM_TEMPLATES.find(t => t.id === id);
}

// Build default config values from a template's configSchema
export function getDefaultConfig(template) {
  return template.configSchema.reduce((acc, field) => {
    acc[field.key] = field.default;
    return acc;
  }, {});
}
