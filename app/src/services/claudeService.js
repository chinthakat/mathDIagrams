import { CLIPART_ITEMS } from '../assets/clipartLibrary';
import { callGemini, getOrCreateShapeCache, getGeminiApiKey } from './geminiService';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Model definitions
export const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash',         label: 'Gemini 3.5 Flash',   provider: 'gemini',   supportsVision: true,  description: 'Fast, cheap, natively supports caching' },
  { id: 'claude-sonnet-4-6',       label: 'Claude Sonnet 4.6',  provider: 'claude',   supportsVision: true,  description: 'Best quality' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', provider: 'claude',   supportsVision: true,  description: 'Fast & cheap' },
  { id: 'deepseek-chat',            label: 'DeepSeek V3',        provider: 'deepseek', supportsVision: false, description: 'Very cheap (text only)' },
  { id: 'deepseek-reasoner',        label: 'DeepSeek R1',        provider: 'deepseek', supportsVision: false, description: 'Strong reasoning' },
];

export function getModel() {
  return localStorage.getItem('maths_model') || 'gemini-3.5-flash';
}
export function saveModel(id) {
  localStorage.setItem('maths_model', id);
}
export function getModelDef(id) {
  return AVAILABLE_MODELS.find(m => m.id === (id || getModel())) || AVAILABLE_MODELS[0];
}

export function getDeepSeekApiKey() { return localStorage.getItem('deepseek_api_key') || import.meta.env.VITE_DEEPSEEK_API_KEY || ''; }
export function saveDeepSeekApiKey(k) { localStorage.setItem('deepseek_api_key', k); }

export const SHAPE_CATALOGUE = `
Available shape types (use these exact strings for the "type" field):
- rectangle: { width, height, fill, stroke, strokeWidth, rotation }
- circle: { radius, fill, stroke, strokeWidth, rotation }
- triangle: { radius, fill, stroke, strokeWidth, rotation }
- polygon: { sides, radius, fill, stroke, strokeWidth, rotation }
- customPolygon: { points: [x1, y1, x2, y2, ...], fill, stroke, strokeWidth, closed, rotation } — closed custom polygon defined by relative coordinates; use this to draw custom irregular/composite shapes like L-shapes, T-shapes, or cut-corner rectangles (e.g. points relative to shape's x,y center)
- rasterImage: { src, width, height, opacity?, flipX?, flipY?, rotation } — renders a clipart/illustration (use for animals, items, vehicles, food). Set "src" to a lowercase word matching the item (e.g. "fishBlue", "butterfly", "apple", "car", "dog", "pencil", "clock", "house", "tree"). The system will automatically resolve the name to a high-quality Twemoji SVG.
- line: { length, stroke, strokeWidth, rotation }
- rightTriangle: { base, height, fill, stroke, strokeWidth, rotation }
- isoscelesTriangle: { base, height, fill, stroke, strokeWidth, rotation }
- equilateralTriangle: { sideLength, fill, stroke, strokeWidth, rotation }
- fractionCircle: { radius, sectors, shaded, fill, stroke, strokeWidth, rotation }
- fractionRectangle: { width, height, rows, cols, shaded, fill, stroke, strokeWidth, rotation }
- fractionBar: { width, height, partitions, shaded, fill, stroke, strokeWidth }
- numberline: { width, min, max, step, isOpen, jumpCount, jumpSize, labelMode, stroke, strokeWidth }
- cartesianPlane: { width, height, domain, range, step, showGrid, showLabels, stroke, strokeWidth, plots: [{expr, color}] }
- barGraph: { width, height, bars: [{id, label, value, color}], title, xAxisLabel, yAxisLabel, yAxisMax, yAxisStep, showGrid, showValues, stroke, strokeWidth, barGap }
    • bars[].label — category text shown below each bar (e.g. "Gold", "Silver", "Bronze")
    • bars[].value — numeric bar height
    • title — chart heading shown above the plot
    • yAxisMax — explicit Y-axis maximum; auto-rounded if omitted
    • showGrid — draw horizontal guide lines (default true)
    • showValues — print value above each bar (default true)
    • Use for: any vertical bar chart / column chart showing discrete categories
- lineGraph: { width, height, title, xAxisLabel, yAxisLabel, series: [{id, label, color, points:[{x,y}]}], xLabels: [string], yMin, yMax, showGrid, showPoints, showLegend, stroke, strokeWidth }
    • series[].points — array of {x, y} coordinate objects (x = index 0,1,2…)
    • xLabels — optional string labels for x-axis ticks (e.g. ["Mon","Tue","Wed"])
    • showLegend — coloured legend panel (default true)
    • Use for: line/trend graphs, time-series charts, multi-series comparisons
- pieChart: { width, height, radius, innerRadius, title, slices: [{id, label, value, color}], showLabels, showLegend, stroke, strokeWidth }
    • slices[].value — raw value (auto-converted to percent)
    • innerRadius — set > 0 for donut/ring chart (default 0 = solid pie)
    • showLabels — percentage labels on slices (default true)
    • Use for: pie charts, donut charts, sector/proportion diagrams
- histogram: { width, height, title, xAxisLabel, yAxisLabel, bars: [{id, label, value, color}], fillColor, showGrid, showValues, stroke, strokeWidth }
    • Bars touch each other (no gap between them) — use for continuous frequency data
    • bars[].label — interval label (e.g. "0–5", "5–10")
    • Use for: frequency histograms, grouped continuous data
- dotPlot: { width, height, title, values: [number], min, max, step, dotRadius, dotColor, stroke, strokeWidth }
    • values — raw data array including repeated values (e.g. [1,2,2,3,3,3,4])
    • step — number line tick interval (default 1)
    • Use for: dot plots, frequency dot diagrams above a number line
- stemLeafPlot: { width, height, title, keyText, stems: [{stem, leaves:[number]}], stroke, fontSize }
    • stems — array of { stem: number|string, leaves: number[] } (e.g. {stem:2, leaves:[3,5,8]})
    • keyText — key line e.g. "1|2 means 12" (shown at bottom)
    • Use for: stem-and-leaf displays, back-to-back stem plots
- pictograph: { width, height, title, iconSrc, iconValue, iconSize, maxIcons, rows: [{id, label, count}], keyText, stroke }
    • iconSrc — clipart id from the library (e.g. "star", "apple", "person", "car")
    • iconValue — units each icon represents (e.g. 2 → each icon = 2 votes)
    • rows[].count — total units for that row (icons auto-calculated as count/iconValue)
    • Use for: pictograms, pictographs, icon charts
- tallyChart: { width, height, title, categories: [{id, label, count}], stroke, strokeWidth }
    • categories — list of rows to display: label (category text) and count (integer tally value)
    • Renders tally marks (groups of 5: 4 vertical + 1 diagonal crossing line) and a frequency total column.
    • Use for: tally mark tables, frequency charts
- tenFrame: { width, height, frameSize, count, counterColor, fillColor, stroke, strokeWidth }
    • frameSize — 5 (five frame) or 10 (ten frame) cells.
    • count — number of circular counter discs inside the frame (0 to frameSize).
    • Use for: 10-frame or 5-frame counting/addition visual problems.
- baseTenBlocks: { width, height, thousands, hundreds, tens, ones, fillColor, stroke, strokeWidth }
    • thousands, hundreds, tens, ones — place value unit counts (e.g. ones=6, tens=4, hundreds=2, thousands=1)
    • Renders 3D blocks (thousands), 10x10 flats (hundreds), vertical rods (tens), and small cubes (ones) grouped side-by-side.
    • Use for: place value block representation diagrams.
- objectArray: { width, height, count, rows, cols, layout, iconSrc, iconSize, spacing, fillColor }
    • layout — 'grid' (ordered rows x cols) or 'scatter' (dispersed scattering within bounds).
    • iconSrc — clipart ID from the library (e.g. 'apple', 'star', 'fishBlue') or empty for circles.
    • count — total items to render (especially for scatter layout).
    • Use for: multiplication arrays, counting groups, grids of objects.
- vennDiagram: { radius, overlapPercent, labelA, labelB, fillA, fillB, fillOverlap }
- annulus: { innerRadius, outerRadius, fill, stroke, strokeWidth, showLabels }
- bearings: { bearing, radius, stroke, strokeWidth, label }
- spinner: { radius, sectors, stroke, strokeWidth, pointerAngle, showPointer }
- factorTree: { rootValue, levelHeight, initialSpread, stroke, strokeWidth }
- angleMarker: { radius, angle, stroke, label }
- point: { radius, fill, label, labelPos }
- rightAngleMarker: { size, stroke, strokeWidth, rotation }
- lengthMarker: { length, label, stroke, strokeWidth, rotation }
- ruler: { width, units, stroke, strokeWidth }
- text: { text, fontSize, fontStyle, fill, fontFamily }
- spiderIcon: { size, fill, stroke, strokeWidth, label, labelPos } — stylised ant/spider creature with 6 legs; use for diagrams with insects/ants/spiders; label e.g. "(A)"
- robot: { width, height, label, fill, stroke, strokeWidth } — renders a customizable 2D robot figure. Set label to "A", "B", etc. Use for scale balance problems involving robots.
- weighingScale: { width, height, weightText, fill, stroke, strokeWidth } — renders a platform balance scale with a digital weight readout (e.g. weightText="85 kg").
- graduatedCylinder: { width, height, capacity, tickInterval, labelInterval, liquidLevel, liquidColor, fill, stroke, strokeWidth, showTicks, showLabels, submergedCubes, label } — laboratory graduated/measuring cylinder with a tick-marked scale and a liquid fill.
    • capacity — the scale's maximum value (e.g. 250 for a 0–250ml cylinder)
    • tickInterval — spacing of unlabelled minor ticks (e.g. 10); labelInterval — spacing of labelled major ticks (e.g. 50)
    • liquidLevel — current fill amount in the same units as capacity (e.g. 150 → liquid fills to the "150" mark)
    • liquidColor — fill color of the liquid (use a light grey e.g. "#d9d9d9" for plain worksheet diagrams, or a color like "#60a5fa" for a colored liquid)
    • submergedCubes — integer count of small unit-cube outlines drawn sitting in the liquid near the bottom; use for volume-by-displacement questions (e.g. "an object is dropped into the cylinder, raising the level from 150 to 210")
    • Use for: measuring cylinders, volume/capacity reading questions, liquid measurement, density/displacement diagrams
    • Example (two cylinders compared): { type:'graduatedCylinder', x:250, y:300, width:90, height:220, capacity:250, liquidLevel:150, label:'Cylinder A' } and { type:'graduatedCylinder', x:450, y:300, width:90, height:220, capacity:250, liquidLevel:210, submergedCubes:6, label:'Cylinder B' }
- beaker: { width, height, capacity, tickInterval, labelInterval, liquidLevel, liquidColor, fill, stroke, strokeWidth, showTicks, showLabels, label } — straight-sided lab beaker with a slight taper, a pour spout at the top-right rim, and a coarse graduated scale.
    • Visually distinct from graduatedCylinder (wider, tapered, has a spout) — use whichever silhouette best matches the question's image/description.
    • Use for: beaker volume readings, mixing/pouring liquid questions, general "container of liquid" science diagrams
    • Example: { type:'beaker', x:300, y:300, width:110, height:130, capacity:500, liquidLevel:300, label:'Beaker A' }
- conicalFlask: { width, height, neckWidth, neckHeightRatio, capacity, liquidLevel, liquidColor, fill, stroke, strokeWidth, label } — Erlenmeyer/conical flask: narrow neck at top opening onto a wide flat base with tapered sides.
    • neckWidth / neckHeightRatio — control how narrow/tall the neck is, for visually different flask silhouettes across questions
    • Use for: chemistry/lab diagrams, swirling-liquid or titration questions, "which flask has more liquid" comparisons
    • Example: { type:'conicalFlask', x:400, y:300, width:130, height:140, neckWidth:34, capacity:250, liquidLevel:120, label:'Flask B' }
- testTube: { width, height, capacity, tickInterval, labelInterval, liquidLevel, liquidColor, fill, stroke, strokeWidth, showTicks, showLabels, label } — narrow tube with a rounded bottom and open top; fine-grained scale (small capacity, e.g. 0–20 mL).
    • Use for: small-volume liquid measurement, test tube rack diagrams, colour-change/reaction questions
    • Example: { type:'testTube', x:200, y:300, width:34, height:150, capacity:20, liquidLevel:12, label:'Tube 1' }
- thermometer: { width, height, minTemp, maxTemp, temperature, tickInterval, labelInterval, liquidColor, fill, stroke, strokeWidth, showTicks, showLabels, label } — vertical thermometer with a bulb at the bottom, mercury column, and a labelled scale that can include negative values.
    • minTemp/maxTemp — set the scale range (e.g. -10 to 110 for a lab thermometer, or -20 to 50 for a weather thermometer)
    • temperature — the current reading (mercury rises/falls to this value)
    • Use for: "what temperature does the thermometer show?", temperature reading/comparison questions, weather diagrams
    • Example: { type:'thermometer', x:250, y:300, height:180, minTemp:-10, maxTemp:110, temperature:37, label:'Thermometer A' }
- bunsenBurner: { width, height, flameHeight, showFlame, flameColor, innerFlameColor, baseColor, barrelColor, stroke, strokeWidth, label } — stylised Bunsen burner with a flared base, barrel, air-hole collar, and two-tone flame.
    • showFlame — set false to show an unlit burner; flameHeight/flameColor vary the flame for different questions (e.g. comparing flame types)
    • Use for: heating/combustion diagrams, lab safety questions, science apparatus diagrams
    • Example: { type:'bunsenBurner', x:400, y:350, width:60, height:130, flameHeight:46, label:'Burner A' }
- dottedLineArrow: { endX, endY, stroke, strokeWidth, dashSize, gapSize, pointerLength, pointerWidth } — dotted/dashed straight line with arrowhead from (0,0) to (endX,endY); use for dotted directional paths
- elbowArrow: { endX, endY, elbowStyle, stroke, strokeWidth, dash, dashSize, gapSize, pointerLength, pointerWidth } — orthogonal/right-angle connector arrow (mermaid flowchart style); elbowStyle: 'h-v','v-h','mid'
- bezierArrow: { endX, endY, curveStyle, curvature, stroke, strokeWidth, dash, dashSize, gapSize, pointerLength, pointerWidth } — smooth bezier curve arrow (plantuml style); curveStyle: 'auto','s-curve','c-curve'
- ropeLoop: { strands: [{ points: [[x,y],...], closed, knots: [pointIndex,...] }], stroke, highlightStroke, strokeWidth, tension, showEndCaps } — flexible rope/cord made of one or more curved strands (points relative to shape's x,y)
    • strands[].points — waypoints the rope curve passes through smoothly (min 2, use more points to route the rope up over a hook and back down)
    • strands[].closed — true to form a closed loop (e.g. a loop draped fully around a hook)
    • strands[].knots — indices into that strand's points array where a small knot bump is drawn
    • Use MULTIPLE strands to depict interlocking/overlapping loops or a rope crossing over/under itself — list each loop as its own strand entry
    • Use for: rope, cord, string, elastic band, strap, or cable diagrams — loops, knots, pulley lines, rope draped over a hook. Pair with the "hook" clipart (rasterImage) for the anchor point.
    • Example (loop hanging from a hook at x=400,y=100): { type:'ropeLoop', x:400, y:150, strands:[{ points:[[0,-40],[35,10],[0,60],[-35,10]], closed:true, knots:[2] }] }
    • DIFFERENT LOOP SHAPES (e.g. comparing several loops side by side): vary the points to change the silhouette —
      narrow/tall loop: [[0,-45],[18,-45],[18,45],[0,45]] (closed) · wide/rounded loop: [[0,-50],[40,-60],[70,-30],[70,30],[40,60],[0,50]] (closed)
      long/thin drooping loop: [[0,-60],[10,60],[-10,90],[-25,60]] (open, closed:false) · loop with a second strand crossing through it: add a 2nd strands[] entry whose points pass through the first loop's bounding area.
    • IMPORTANT: ropeLoop is ALWAYS available and can represent ANY rope/cord/loop/knot/strap/elastic-band shape, including several visually-different loop variants side by side (e.g. narrow vs wide vs tapered). NEVER list rope, cord, loop, knot, strap, or band shapes under missingComponents/missingObjects — always use ropeLoop with points tuned to match the specific silhouette instead.

CLOCK & TIME SHAPES — use these for any time/clock related questions:
- analogClock: { radius, hours, minutes, seconds, showSeconds, showNumbers, showTicks, faceColor, rimColor, handColor, secondColor, label, rimWidth, style }
    • hours: integer 0–11 (hour hand position), minutes: integer 0–59, seconds: integer 0–59
    • style: 'classic' (default) | 'minimal' | 'roman' (Roman numerals)
    • showSeconds: true to draw red second hand
    • Use for: "What time does this clock show?", elapsed time, half-past/quarter-to questions, reading time
    • Example: { type:'analogClock', x:300, y:250, radius:90, hours:3, minutes:30, label:'Clock A' }
- digitalClock: { timeText, width, height, style, bgColor, textColor, borderColor, label, fontSize }
    • timeText: exact string to display e.g. "3:15 PM", "09:45", "2:30 AM"
    • style: 'lcd' (green, default) | 'led' (red glow) | 'alarm' (cyan) | 'station' (amber, departure board style)
    • Use for: digital time reading, patterns of times, sequences of departure/arrival times as single-clock option shapes
    • Example: { type:'digitalClock', x:200, y:200, timeText:'10:15 AM', style:'lcd', width:160, height:80, label:'Bus departs' }
- departureBoard: { title, times, width, height, bgColor, textColor, titleColor, label }
    • title: board heading e.g. "DEPARTURES", "ARRIVALS", "TRAIN TIMES"
    • times: comma-separated list of time strings, use "?" for the missing entry e.g. "08:15,08:45,09:15,?"
    • Use for: train/bus departure pattern questions, time sequence puzzles with a question mark entry
    • Example: { type:'departureBoard', x:400, y:300, title:'DEPARTURES', times:'08:15,08:45,09:15,?', width:220, height:160 }

CLOCK QUESTION GUIDANCE:
  ✓ For "what time does this clock show?" → use analogClock with specified hours/minutes
  ✓ For "which clock shows 3:30?" → use analogClock for options (small radius ~50)
  ✓ For digital sequence/pattern questions → use departureBoard or multiple digitalClock shapes
  ✓ For elapsed time questions → show two analogClock or digitalClock shapes side by side
  ✓ Always label clocks if there are multiple (label: 'Clock A', 'Start', 'Finish', etc.)

MAP & SPATIAL LAYOUT SHAPES — use these for floor plans, campus/building/space-station maps, town maps, treasure maps, or ANY question about which location is North/South/East/West/North-East/etc. of another:
- gridMap: { width, height, rows, cols, showCompass, scaleText, landmarks: [{id,row,col,label,icon,color}], routes: [{id,path,color}], stroke } — a complete grid-based map with a built-in compass rose (top-right) and scale bar (bottom).
    • landmarks[].row / landmarks[].col — 1-indexed grid position. row 1 = North-most row, increasing row = further South. col 1 = West-most column, increasing col = further East. This is what makes compass-direction questions answerable from the diagram.
    • landmarks[].icon — icon name, one of: MapPin, Building, Home, Hospital, Store, School, Library, Tree, Mountain, Road, Car, Compass, Route, Footprints, Crosshair, Coffee, Restaurant, Mailbox, Flag, Star, DirectionArrow (pick whichever best matches the label's meaning; Crosshair/MapPin/Building are safe generic fallbacks)
    • routes[].path — cell references joined by "-", e.g. "A1-A4-D4" (column letter + row number), draws a dashed route arrow between landmarks
    • MANDATORY: for ANY question asking which room/module/place is North/South/East/West/North-East/North-West/South-East/South-West of another, you MUST use gridMap with landmarks positioned at the correct row/col — NEVER represent this as a hub-and-spoke node diagram (a central box with plain rectangles connected by lines radiating outward), because compass directions cannot be read off a radial node graph. If the source image shows a table/grid of labelled cells, reproduce it as a gridMap with matching rows/cols, not as a table or a node graph.
    • Example (space station modules — "which module is South-West of Command Center?"): { type:'gridMap', x:400, y:300, width:360, height:360, rows:5, cols:5, showCompass:true, scaleText:'', landmarks:[ {id:'cc',row:3,col:3,label:'Command Center',icon:'Crosshair',color:'#3b82f6'}, {id:'ob',row:1,col:3,label:'Observatory',icon:'Star',color:'#8b5cf6'}, {id:'ol',row:5,col:1,label:'Oxygen Lab',icon:'Building',color:'#22c55e'} ] }
- mapBuilding: { width, height, buildingType, fill, stroke, strokeWidth, label, iconName, showLabel } — a standalone labelled 2.5D structure for map scenes or campus/town layouts (used on its own, outside gridMap, or to decorate the canvas around a gridMap).
    • buildingType — choose the silhouette that matches what the structure represents: 'house' (pitched roof — home, school, shop), 'flatBlock' (flat-roofed modern block — office, command centre, hospital, apartment), 'tower' (tall shaft with an antenna/mast — control tower, observatory, comms/solar array), 'dome' (rounded dome on a base — observatory, greenhouse, planetarium), 'hangar' (arched roof — warehouse, aircraft hangar, docking bay, garage)
    • Vary buildingType (and fill color) across the structures in one diagram so each labelled location looks visually distinct — do not reuse the same buildingType/color for every landmark
    • Use for: town/campus maps, "label the buildings" diagrams, scale/direction questions between named structures
    • Example: { type:'mapBuilding', x:200, y:250, width:90, height:70, buildingType:'house', label:'School', iconName:'School', fill:'#3b82f6' } and { type:'mapBuilding', x:380, y:250, width:70, height:100, buildingType:'tower', label:'Observatory', iconName:'Star', fill:'#8b5cf6' }
- mapMarker: { radius, color, label, iconName, showLabel } — a teardrop pin marking a single point on a map or coordinate plane.
- compassRose: { radius, color, fill, fontSize } — a standalone decorative N/E/S/W compass rose for map diagrams not built with gridMap (gridMap already includes one via showCompass).
- scaleBar: { width, height, color, unitText, fontSize } — a map scale reference bar, e.g. unitText:"100m".
- Map scenery (optional decoration for map/town scenes): road { width, height, fill, lineColor }, roadJunction { junctionType:'cross'|'t-junction'|'y-junction'|'roundabout', size, fill, lineColor }, bridge { length, width, fill, lineColor, bridgeType:'suspension'|'beam'|'stone-arch', label }, footpath { length, width, color }, river { length, width, color }, lake { radius, color, stroke }, sea { width, height, color, stroke }, mountain { width, height, color, stroke }, playground { width, height, color, stroke }, airport { width, height, color, stroke, iconName }, port { width, height, color, stroke, iconName }.

All shapes require: { type, x, y }

Canvas is 800x600 logical pixels. Center is x=400, y=300.
For option diagrams the canvas is 400x300 — centre at x=200, y=150. Keep option shapes small and centred there.
`;

const SYSTEM_PROMPT = `You are a mathematics diagram generator for primary and middle school (Years 2–8).
Your job is to generate diagram objects and a multiple-choice question (MCQ) for the given request.

${SHAPE_CATALOGUE}

You MUST respond with ONLY valid JSON in exactly this structure:

{
  "objects": [ ...shapes for the main diagram... ],
  "question": "Question stem text",
  "correctAnswer": <option>,
  "distractors": [<option>, <option>, <option>]
}

Where <option> is either:
  - A plain string like "24 cm²"    — for purely numerical/word answers only
  - An object { "text": "label", "objects": [...shapes] }  — when a diagram makes the option clearer

DECISION RULE — use diagram options whenever the answer involves a visual:
  ✓ Bearings / directions (show a small compass with the bearing arrow)
  ✓ Shapes / geometry (show the shape)
  ✓ Fractions (show a fraction circle or bar)
  ✓ Graphs / charts (show a mini bar or line graph)
  ✓ Number lines (show the number line with the value marked)
  ✓ Angles (show the angle)
  ✓ Multiple design variants (show each design as a small diagram)
  ✓ Any question where seeing the answer is clearer than reading it

Use plain text ONLY for:
  - Pure numerical calculation answers (e.g. "35 cm²", "12.5 m")
  - Simple word answers with no visual component (e.g. "addition", "rectangle")

When using diagram options:
- EVERY option (correctAnswer AND all 3 distractors) MUST use { "text", "objects" } format
- Option canvas is 400×300; centre shapes at x=200, y=150
- Use 1–3 shapes per option, keep them simple and clearly different from each other
- "text" can be a short label (e.g. "120°") or "" if the diagram is self-explanatory

Example for a bearings question — correctAnswer and each distractor should be:
  { "text": "120°", "objects": [{ "type": "bearings", "x": 200, "y": 150, "bearing": 120, "radius": 80 }] }
  { "text": "060°", "objects": [{ "type": "bearings", "x": 200, "y": 150, "bearing": 60,  "radius": 80 }] }

Rules for all questions:
- "question" must be a clean stem only — it must NOT list or describe the options inside it
- Use CONCRETE numbers (e.g. "side = 10 m") NOT abstract variables like "s", "a × b"
- Clipart / Illustrations: When generating diagrams that involve objects, animals, vehicles, or fruit, you MUST use rasterImage with a descriptive src (e.g. "fishBlue", "butterfly", "apple", "car", "dog") rather than drawing them manually with vectors. This makes diagrams look highly polished and premium.
- correctAnswer must be mathematically correct — double-check your arithmetic before writing it
- distractors must be plausible but wrong — common student errors
- Do NOT include any explanation, markdown, or text outside the JSON

Mathematical rules to apply (do not get these wrong):
- Perimeter of a rectangle = 2×(length + width). Removing a corner rectangle does NOT change perimeter; removing from a mid-edge INCREASES it.
- Area of triangle = ½×base×height. Area of trapezium = ½×(a+b)×h.
- Fractions: always reduce to lowest terms. Equivalent fractions must have the same value.
- Bearings are measured clockwise from North, 000°–360°.
- Probability: all outcomes must sum to 1.
`;

// ─── API callers ──────────────────────────────────────────────────────────────

async function callClaude(userMessage, apiKey, modelId) {
  const model = modelId || getModel();
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return normalise(JSON.parse(cleaned)); }
  catch { throw new Error('Claude returned invalid JSON. Please try again.'); }
}

async function callDeepSeek(userMessage, apiKey) {
  const modelId = getModel();
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `DeepSeek API error: ${response.status}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return normalise(JSON.parse(cleaned)); }
  catch { throw new Error('DeepSeek returned invalid JSON. Please try again.'); }
}

// Route to correct provider
async function callAI(userMessage, apiKey) {
  const def = getModelDef();
  if (def.provider === 'deepseek') {
    const dsKey = apiKey || getDeepSeekApiKey();
    if (!dsKey) throw new Error('DeepSeek API key not set.');
    return callDeepSeek(userMessage, dsKey);
  }
  
  if (def.provider === 'gemini') {
    const gKey = apiKey || getGeminiApiKey();
    if (!gKey) throw new Error('Gemini API key not set.');
    
    // Explicitly document all available cliparts to maximize cache effectiveness
    const clipartNames = CLIPART_ITEMS.map(c => `- ${c.id}: ${c.label} (Category: ${c.category})`).join('\n');
    const fullSystemInstruction = SYSTEM_PROMPT + '\n\nAVAILABLE RASTERIMAGE CLIPARTS:\n' + clipartNames;
    
    // Use Context Caching to eliminate system prompt latency and cost
    const cacheName = await getOrCreateShapeCache(gKey, fullSystemInstruction, `models/${def.id}`);
    
    const resText = await callGemini({
      systemInstruction: fullSystemInstruction,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      model: def.id,
      apiKey: gKey,
      cachedContentName: cacheName
    });
    
    try { return normalise(JSON.parse(resText)); }
    catch { throw new Error('Gemini returned invalid JSON. Please try again.'); }
  }
  
  return callClaude(userMessage, apiKey, def.id);
}

// ─── Normalisation ─────────────────────────────────────────────────────────────

function normaliseOption(opt) {
  if (typeof opt === 'string') return { text: opt, objects: null };
  if (opt && typeof opt === 'object')
    return { text: opt.text ?? '', objects: Array.isArray(opt.objects) ? opt.objects : null };
  return { text: String(opt), objects: null };
}

function normalise(raw) {
  return {
    objects: raw.objects ?? [],
    question: raw.question ?? '',
    correctAnswer: normaliseOption(raw.correctAnswer),
    distractors: (raw.distractors ?? []).map(normaliseOption),
  };
}

// ─── Verification pass (always Haiku — cheap) ─────────────────────────────────

const VERIFY_PROMPT = `You are a mathematics teacher checking a generated MCQ question for accuracy.
You receive JSON: { question, correctAnswer, distractors }.
Check:
1. Is "question" a clean stem with NO option descriptions embedded in it? If not, rewrite it.
2. Does "question" use concrete numbers (not abstract variables like "s", "a×b")? If not, substitute real values.
3. Is correctAnswer mathematically correct? If not, fix it.
4. Are the distractors wrong but plausible? Fix any accidentally-correct distractor.

Return ONLY the corrected JSON with identical structure — no markdown, no explanation:
{ "question": "...", "correctAnswer": <same format>, "distractors": [<same format>, ...] }`;

async function verifyAndFix(generated, claudeApiKey) {
  const payload = { question: generated.question, correctAnswer: generated.correctAnswer, distractors: generated.distractors };
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: VERIFY_PROMPT,
        messages: [{ role: 'user', content: JSON.stringify(payload) }],
      }),
    });
    if (!response.ok) return generated;
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const fixed = JSON.parse(cleaned);
    return {
      ...generated,
      question: fixed.question ?? generated.question,
      correctAnswer: normaliseOption(fixed.correctAnswer ?? generated.correctAnswer),
      distractors: (fixed.distractors ?? generated.distractors).map(normaliseOption),
    };
  } catch { return generated; }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function generateDiagramFromPrompt(prompt, apiKey, yearLevel = 5) {
  const message = `Year ${yearLevel} mathematics diagram request: ${prompt}

Generate diagram objects and an MCQ. Use concrete numbers. Use diagram options if visual.`;
  const result = await callAI(message, apiKey);
  return verifyAndFix(result, apiKey);
}

export async function generateFromTemplate(template, config, apiKey, yearLevel = 5) {
  const configDesc = Object.entries(config)
    .map(([k, v]) => `  ${k} = ${JSON.stringify(v)}`).join('\n');
  const message = `Year ${yearLevel} mathematics diagram: ${template.name}
Description: ${template.description}
Question type: ${template.questionHints?.type || 'general'}

Configuration:
${configDesc}

Generate diagram objects and an MCQ. Use the configured values above as concrete numbers.
For a visual/geometry diagram, use diagram-based answer options (each option shows a small diagram).`;
  const result = await callAI(message, apiKey);
  return verifyAndFix(result, apiKey);
}

// ─── Image classification (always Haiku vision) ───────────────────────────────

const CLASSIFY_PROMPT = `You are analysing a primary/middle school mathematics question image.
Respond with ONLY valid JSON:
{
  "mathConcept": "short name e.g. 'bar graph', '3D rotation', 'bearings', 'fractions', 'perimeter designs'",
  "questionType": "geometry | data_graph | number | measurement | probability | spatial | fractions | algebra",
  "yearLevel": number 2–8,
  "diagramDescription": "precise description of the diagram structure",
  "questionSummary": "precise summary of what the question asks",
  "answerStyle": "diagram | numerical | text_word"
}`;

function buildSonnetImagePrompt(classification, yearLevel) {
  const yr = yearLevel || classification.yearLevel;
  return `You are looking at a Year ${yr} mathematics question image.
Create a COMPLETELY NEW, DIFFERENT question of the SAME TYPE:
- Same mathematical concept: ${classification.mathConcept}
- Same question style: ${classification.questionSummary}
- Use CONCRETE numbers — no abstract variables like "s", "a", "x"
- Different numbers, context, and wording — do NOT copy the original

Answer style: ${classification.answerStyle}
${classification.answerStyle === 'diagram'
  ? '→ EVERY option MUST be { "text": "short label", "objects": [...] } with 1–2 simple shapes at x=200,y=150. Options must look clearly different.'
  : '→ Use plain string options.'}

CRITICAL: Keep main diagram to 2–6 shapes. Only use shape types from the catalogue. Return ONLY JSON.`;
}

async function callClaudeWithImage(imageBase64, mimeType, systemPrompt, userText, apiKey, model, maxTokens = 1024) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
        { type: 'text', text: userText },
      ]}],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function generateFromSampleImage(imageBase64, mimeType, apiKey, yearLevel) {
  // Step 1 — Haiku: cheap image classification
  let classification;
  try {
    classification = await callClaudeWithImage(
      imageBase64, mimeType, CLASSIFY_PROMPT,
      'Analyse this maths question image and return the JSON classification.',
      apiKey, 'claude-haiku-4-5-20251001', 512
    );
  } catch {
    classification = { mathConcept: 'mathematics diagram', questionType: 'geometry', yearLevel: yearLevel || 5, diagramDescription: 'a mathematics diagram', questionSummary: 'a mathematics question', answerStyle: 'diagram' };
  }

  // For geometry/spatial/multi-design questions, force diagram answer style
  if (['geometry', 'spatial', 'measurement'].includes(classification.questionType) && classification.answerStyle === 'text_word') {
    classification.answerStyle = 'diagram';
  }

  // Step 2 — Sonnet (vision): sees original image + classification context
  const userPrompt = buildSonnetImagePrompt(classification, yearLevel);
  const selectedDef = getModelDef();
  // Always use a Claude vision model for image-based generation
  const visionModel = selectedDef.supportsVision ? selectedDef.id : 'claude-sonnet-4-6';
  const raw = await callClaudeWithImage(imageBase64, mimeType, SYSTEM_PROMPT, userPrompt, apiKey, visionModel, 6000);

  const normalised = normalise(raw);
  const verified = await verifyAndFix(normalised, apiKey);
  return { ...verified, classification };
}

// ─── Image-to-editable-shapes analysis ───────────────────────────────────────

// Pass 1: Extract every visible text/number/time value from the image via OCR.
async function extractImageValues(base64, mimeType, apiKey) {
  const system = `You are a precise OCR assistant for educational maths diagrams.
Extract text exactly as it appears — do not paraphrase or normalise.`;
  const user = `Look at this diagram image carefully.
Extract ALL visible text, numbers, times, and labels EXACTLY as they appear.

Return ONLY valid JSON with this structure:
{
  "allTexts": ["every visible string, exactly as shown in the image"],
  "times": ["time values e.g. '10:15 AM', '08:30', '2:15 PM'"],
  "numbers": ["numeric values e.g. '42', '3.14', '?'"],
  "labels": ["letter/word labels e.g. 'A', 'B', 'DEPARTURES', 'ARRIVALS'"],
  "missingSlots": ["slots showing '?' that represent the unknown"],
  "diagramDescription": "one sentence describing the diagram type and what it shows"
}

Critical: copy every string character-for-character including AM/PM, colons, spaces, and question marks.`;

  try {
    return await callClaudeWithImage(base64, mimeType, system, user, apiKey, 'claude-sonnet-4-6', 1024);
  } catch {
    return { allTexts: [], times: [], numbers: [], labels: [], missingSlots: [], diagramDescription: '' };
  }
}

// Pass 3: Verify that generated shapes use the extracted values, fix any mismatches.
function verifyAndFixExtractedValues(shapes, extracted) {
  if (!extracted || !Array.isArray(extracted.allTexts) || extracted.allTexts.length === 0) return { shapes, issues: [] };

  const allValid = new Set(extracted.allTexts.map(t => String(t).trim()));
  const issues = [];

  const fixed = shapes.map(s => {
    const out = { ...s };

    // Check digitalClock timeText
    if (s.type === 'digitalClock' && s.timeText && !allValid.has(String(s.timeText).trim())) {
      // Find a time from extracted that's not already used by another shape
      const usedTimes = shapes.filter(o => o !== s && o.type === 'digitalClock').map(o => o.timeText);
      const candidate = (extracted.times || []).find(t => !usedTimes.includes(t));
      if (candidate) {
        issues.push({ type: 'digitalClock', field: 'timeText', was: s.timeText, fixed: candidate });
        out.timeText = candidate;
      } else {
        issues.push({ type: 'digitalClock', field: 'timeText', was: s.timeText, fixed: null });
      }
    }

    // Check departureBoard times string
    if (s.type === 'departureBoard' && s.times) {
      const slots = s.times.split(',').map(t => t.trim());
      const extractedTimes = extracted.times || [];
      if (extractedTimes.length > 0) {
        // Replace all non-'?' slots with extracted times in order
        const knownTimes = extractedTimes.filter(t => t !== '?');
        let ti = 0;
        const fixedSlots = slots.map(slot => {
          if (slot === '?') return '?';
          if (!allValid.has(slot) && ti < knownTimes.length) {
            const replacement = knownTimes[ti++];
            issues.push({ type: 'departureBoard', field: 'times', was: slot, fixed: replacement });
            return replacement;
          }
          ti++;
          return slot;
        });
        out.times = fixedSlots.join(',');
      }
    }

    // Check text shapes
    if (s.type === 'text' && s.text && !allValid.has(String(s.text).trim())) {
      issues.push({ type: 'text', field: 'text', was: s.text, fixed: null });
    }

    return out;
  });

  return { shapes: fixed, issues };
}

export const REGISTERED_COMPONENT_TYPES = [
  'rasterImage',
  'rectangle','circle','triangle','polygon','customPolygon','line','rightTriangle','isoscelesTriangle',
  'equilateralTriangle','fractionCircle','fractionRectangle','fractionBar','numberline',
  'cartesianPlane','barGraph','lineGraph','pieChart','histogram','dotPlot','stemLeafPlot','pictograph',
  'tallyChart','tenFrame','baseTenBlocks','objectArray',
  'vennDiagram','annulus','bearings','spinner','factorTree',
  'angleMarker','point','rightAngleMarker','lengthMarker','ruler','text',
  'road','roadJunction','bridge','tree','river','lake','sea','mountain','footpath',
  'playground','airport','port','mapMarker','mapBuilding','mapSprite','gridMap','scaleBar',
  'compassRose','sunDirection','flag','dataTable','coordAxes',
  'spiderIcon','dottedLineArrow','elbowArrow','bezierArrow','ropeLoop',
  'robot', 'weighingScale', 'graduatedCylinder',
  'beaker', 'conicalFlask', 'testTube', 'thermometer', 'bunsenBurner',
  'analogClock', 'digitalClock', 'departureBoard',
];


const makeAnalyseForEditingPrompt = (imageUrl, extractedValues) => {
const extractedBlock = extractedValues && (extractedValues.allTexts || []).length > 0 ? `
━━━ EXACT VALUES EXTRACTED FROM THE ORIGINAL IMAGE — MANDATORY ━━━
These values were OCR-extracted from the image with high precision.
You MUST use these EXACT strings in the corresponding shape fields.
DO NOT substitute, round, invent, or paraphrase any of these values.

All visible texts:  ${(extractedValues.allTexts || []).map(t => `"${t}"`).join(', ')}
Time values:        ${(extractedValues.times || []).length ? (extractedValues.times || []).map(t => `"${t}"`).join(', ') : '(none)'}
Numbers:            ${(extractedValues.numbers || []).length ? (extractedValues.numbers || []).map(n => `"${n}"`).join(', ') : '(none)'}
Labels:             ${(extractedValues.labels || []).length ? (extractedValues.labels || []).map(l => `"${l}"`).join(', ') : '(none)'}
Missing slots (?):  ${(extractedValues.missingSlots || []).length ? (extractedValues.missingSlots || []).join(', ') : '(none)'}
Diagram type:       ${extractedValues.diagramDescription || ''}

ENFORCEMENT RULES:
• Every digitalClock "timeText" MUST be one of the time values listed above.
• Every departureBoard "times" field MUST contain only the time values above (comma-separated).
• Every text shape "text" field MUST match one of the allTexts values above.
• If the diagram shows a question mark "?" in a slot, keep that slot as "?" in the shape data.
• If a value appears in the image but you are unsure of exact formatting, use what is listed above.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : '';

return `You are analysing a primary/middle school maths diagram image.
Your task: reconstruct it as editable Konva shape objects using ONLY the registered component types below.
${extractedBlock}

REGISTERED COMPONENT TYPES (use EXACT strings):
${REGISTERED_COMPONENT_TYPES.join(', ')}

━━━ CLIPART LIBRARY — USE THESE INSTEAD OF DRAWING ILLUSTRATIONS ━━━
We have a built-in clipart library. When the diagram contains animals, vehicles, or objects
that match an entry below, use rasterImage with the exact URL from this list.

Available clipart (id → URL):
${CLIPART_ITEMS.map(i => `  ${i.id}: ${i.url}  [${i.label}]`).join('\n')}

- rasterImage: { src, x, y, width, height, opacity?, flipX?, flipY? }
  • src = one of the clipart URLs above (preferred), OR src="ORIGINAL" for the source image
  • flipX: true  = mirror horizontally (use for reflections across a vertical axis)
  • flipY: true  = mirror vertically   (use for reflections across a horizontal axis)
  • rotation = degrees clockwise (use for rotations/turns)

  STRATEGY for illustration MCQ questions (e.g. "which fish is the reflection?"):
  1. Identify the BEST matching clipart item (e.g. 'fish' for a fish question).
  2. Place ONE clipart rasterImage at the MAIN question illustration position (the "before" shape).
  3. For EACH MCQ option box (A/B/C/D), ALSO place a clipart rasterImage inside the box
     with the correct transformation (flipX, flipY, rotation) to show what that option looks like.
     Example for a horizontal reflection question:
       - Main fish (original):  { src: fishUrl, flipX: false, flipY: false }
       - Option A (reflected):  { src: fishUrl, flipX: true,  flipY: false }
       - Option B (original):   { src: fishUrl, flipX: false, flipY: false }
       - Option C (rotated 90): { src: fishUrl, rotation: 90 }
       - Option D (reflected+rotated): { src: fishUrl, flipX: true, rotation: 180 }
  4. Draw rectangle frames for each option box and add letter labels (A, B, C, D) as text.
  5. Add the question text and any geometric elements (dotted lines, arrows).
  ❌ DO NOT use src="ORIGINAL" for individual option boxes — use clipart URLs instead.
  ❌ DO NOT trace illustrations with customPolygon.

${SHAPE_CATALOGUE}

━━━ POSITIONING RULES (critical — follow exactly) ━━━
The canvas is 800×500 logical pixels. x increases right, y increases down. (0,0) = top-left.

STEP 1 — MAP THE IMAGE: For every element estimate its centre as a fraction of image width/height,
  then convert: canvasX = fracX × 800, canvasY = fracY × 500.
STEP 2 — SIZE ELEMENTS: Element spanning 20% of image width → 160 px wide on canvas.
STEP 3 — VERIFY: No two shapes overlap unless they do in the original.

• Same horizontal row → same (or very close) y values.
• NEVER cluster everything at the centre — spread to match the original layout.

COLOR RULES:
• Border/frame boxes → fill='#ffffff', stroke='#333333', strokeWidth=2. NEVER black fill.
• Geometric content shapes → fill='#a8d8ea' (light blue) unless the image shows otherwise.
• Text labels → fill='#000000'.

SHAPE RULES:
• IRREGULAR SHAPES (L-shape, notched rect, trapezoid): use customPolygon with points relative to shape x,y.
• TEXT LABELS: add a text shape for every visible number, letter, or word.

CRITICAL — NO WORKAROUNDS FOR MISSING DIAGRAM COMPONENTS:
If the diagram contains a complex layout (like a table grid, lift/elevator shaft, calendar page) or specific illustration (like a submarine, specialized vehicle, animal, custom tool) that is NOT present in the SHAPE_CATALOGUE and has no matching clipart in the registered cliparts list, do NOT try to trace or suggest drawing them using generic shapes (lines, rectangles, customPolygon). You MUST list them in the "missingComponents" array in the JSON response, describing the missing component and why it is needed.

Respond ONLY with valid JSON:
{
  "description": "brief description",
  "diagramType": "e.g. reflection, geometry, graph, fraction, map, etc.",
  "shapes": [ ...shape objects with type, x, y, and type-specific props... ],
  "missingComponents": [
    { "name": "ComponentName", "description": "what it renders", "reason": "why needed" }
  ],
  "coveragePercent": number 0-100
}

If fully reproducible, missingComponents = [].
Image URL (for reference): ${imageUrl}`;
};

async function callClaudeWithImageUrl(imageUrl, systemPrompt, userText, apiKey, model, maxTokens = 1024) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'url', url: imageUrl } },
        { type: 'text', text: userText },
      ]}],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function fetchImageBase64(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const mimeType = blob.type || 'image/jpeg';
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ base64: reader.result.split(',')[1], mimeType });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function analyseImageForEditing(imageUrl, apiKey) {
  // Fetch image as base64 first (avoids CORS in Konva canvas, also needed for Pass 1).
  const b64 = await fetchImageBase64(imageUrl);

  // ── Pass 1: Extract exact values (OCR) ───────────────────────────────────────
  let extractedValues = { allTexts: [], times: [], numbers: [], labels: [], missingSlots: [], diagramDescription: '' };
  if (b64) {
    extractedValues = await extractImageValues(b64.base64, b64.mimeType, apiKey);
  }

  // ── Pass 2: Generate shapes, injecting extracted values as hard constraints ──
  const prompt = makeAnalyseForEditingPrompt(imageUrl, extractedValues);
  const result = b64
    ? await callClaudeWithImage(b64.base64, b64.mimeType, prompt,
        'Analyse this diagram and output the JSON reconstruction. Use ONLY the exact values listed in the MANDATORY section.',
        apiKey, 'claude-haiku-4-5-20251001', 4096)
    : await callClaudeWithImageUrl(imageUrl, prompt,
        'Analyse this diagram and output the JSON reconstruction.',
        apiKey, 'claude-haiku-4-5-20251001', 4096);

  // Replace 'ORIGINAL' placeholder with a data URL.
  const dataUrlSrc = b64 ? `data:${b64.mimeType};base64,${b64.base64}` : imageUrl;
  let shapes = (Array.isArray(result.shapes) ? result.shapes : []).map(s =>
    s.type === 'rasterImage' && s.src === 'ORIGINAL' ? { ...s, src: dataUrlSrc } : s
  );

  // ── Pass 3: Verify & fix value mismatches ────────────────────────────────────
  const { shapes: verifiedShapes, issues } = verifyAndFixExtractedValues(shapes, extractedValues);

  return {
    description: result.description || '',
    diagramType: result.diagramType || 'diagram',
    shapes: verifiedShapes,
    missingComponents: Array.isArray(result.missingComponents) ? result.missingComponents : [],
    coveragePercent: typeof result.coveragePercent === 'number' ? result.coveragePercent : 100,
    extractedValues,
    valueVerification: issues,
  };
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

export function getApiKey() { return localStorage.getItem('claude_api_key') || import.meta.env.VITE_CLAUDE_API_KEY || ''; }
export function saveApiKey(key) { localStorage.setItem('claude_api_key', key); }
