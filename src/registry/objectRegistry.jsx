import React from 'react';
import { Square, Circle, Triangle, Minus, Type, Scaling, Hexagon, Dot, CornerRightDown, ChevronsRight, Tally2, Pentagon, Octagon, Compass, MapPin, Building2, TreePine, Flag, Sun, Map as MapIcon, Heart, Car } from 'lucide-react';
import { Rect as KonvaRect, Circle as KonvaCircle, RegularPolygon as KonvaPolygon, Arrow as KonvaArrow, Text as KonvaText, Arc as KonvaArc } from 'react-konva';
import AngleMarker from '../components/MathObjects/AngleMarker';
import Point from '../components/MathObjects/Point';
import RightAngleMarker from '../components/MathObjects/RightAngleMarker';
import CongruentMarker from '../components/MathObjects/CongruentMarker';
import ParallelMarker from '../components/MathObjects/ParallelMarker';
import RightTriangle from '../components/MathObjects/RightTriangle';
import IsoscelesTriangle from '../components/MathObjects/IsoscelesTriangle';
import EquilateralTriangle from '../components/MathObjects/EquilateralTriangle';
import FractionRectangle from '../components/MathObjects/FractionRectangle';
import FractionCircle from '../components/MathObjects/FractionCircle';
import FractionBar from '../components/MathObjects/FractionBar';
import LengthMarker from '../components/MathObjects/LengthMarker';
import Ruler from '../components/MathObjects/Ruler';
import NumberLine from '../components/MathObjects/NumberLine';
import CartesianPlane from '../components/MathObjects/CartesianPlane';
import GridMap from '../components/MathObjects/GridMap';
import BarGraph from '../components/MathObjects/BarGraph';
import DataTable from '../components/MathObjects/DataTable';
import VennDiagram from '../components/MathObjects/VennDiagram';
import MathIcon from '../components/MathObjects/MathIcon';
import MapMarker from '../components/MathObjects/MapMarker';
import FlagComponent from '../components/MathObjects/Flag';
import MapBuilding from '../components/MathObjects/MapBuilding';
import Road from '../components/MathObjects/Road';
import Tree from '../components/MathObjects/Tree';
import River from '../components/MathObjects/River';
import Lake from '../components/MathObjects/Lake';
import Sea from '../components/MathObjects/Sea';
import Mountain from '../components/MathObjects/Mountain';
import Bridge from '../components/MathObjects/Bridge';
import Footpath from '../components/MathObjects/Footpath';
import Playground from '../components/MathObjects/Playground';
import Airport from '../components/MathObjects/Airport';
import Port from '../components/MathObjects/Port';
import SunDirection from '../components/MathObjects/SunDirection';
import CompassRose from '../components/MathObjects/CompassRose';
import ScaleBar from '../components/MathObjects/ScaleBar';
import { PieChart, LayoutGrid, SquareSplitHorizontal, MoveHorizontal, Ruler as RulerIcon, Grid, BarChart3, Table, CircleDashed, ArrowRight, ArrowLeftRight, Navigation, Image as ImageIcon } from 'lucide-react';

const ICON_PRESETS = [
  { value: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Flag_of_Australia.svg/1200px-Flag_of_Australia.svg.png', label: 'Australian Flag' },
  { value: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ae/Flag_of_the_United_Kingdom.svg/1200px-Flag_of_the_United_Kingdom.svg.png', label: 'UK Flag' },
  { value: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/1200px-Flag_of_the_United_States.svg.png', label: 'US Flag' },
  { value: 'https://cdn-icons-png.flaticon.com/512/320/320114.png', label: 'Calculator' },
  { value: 'https://cdn-icons-png.flaticon.com/512/2921/2921932.png', label: 'Protractor' },
  { value: 'https://cdn-icons-png.flaticon.com/512/3061/3061327.png', label: 'Compass' }
];

const FONT_PRESETS = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Georgia', label: 'Georgia' }
];

// Registry of all 2D mathematical objects
export const ObjectRegistry = {
  // CATEGORY A: Basic Shapes
  rectangle: {
    id: 'rectangle',
    category: 'Basic Shapes',
    name: 'Rectangle',
    icon: <Square size={18} />,
    defaultProps: { width: 100, height: 100, fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <KonvaRect width={props.width} height={props.height} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Fill Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 0, max: 10 },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' }
    ]
  },
  circle: {
    id: 'circle',
    category: 'Basic Shapes',
    name: 'Circle',
    icon: <Circle size={18} />,
    defaultProps: { radius: 50, fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <KonvaCircle radius={props.radius} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Fill Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 0, max: 10 },
      { name: 'radius', label: 'Radius', type: 'number' }
    ]
  },
  triangle: {
    id: 'triangle',
    category: 'Basic Shapes',
    name: 'Triangle',
    icon: <Triangle size={18} />,
    defaultProps: { radius: 50, fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <KonvaPolygon sides={3} radius={props.radius} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Fill Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 0, max: 10 },
      { name: 'radius', label: 'Radius', type: 'number' }
    ]
  },
  polygon: {
    id: 'polygon',
    category: 'Basic Shapes',
    name: 'Polygon',
    icon: <Hexagon size={18} />,
    defaultProps: { sides: 5, radius: 50, fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <KonvaPolygon sides={props.sides} radius={props.radius} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Fill Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 0, max: 10 },
      { name: 'radius', label: 'Radius', type: 'number' },
      { name: 'sides', label: 'Number of Sides', type: 'range', min: 3, max: 12 }
    ]
  },
  line: {
    id: 'line',
    category: 'Basic Shapes',
    name: 'Line / Ray',
    icon: <Minus size={18} />,
    defaultProps: { length: 150, stroke: '#334155', strokeWidth: 4, pointerWidth: 0, pointerLength: 0, rotation: 0 },
    Component: ({ props }) => <KonvaArrow points={[0, 0, props.length, 0]} stroke={props.stroke} strokeWidth={props.strokeWidth} pointerWidth={props.pointerWidth} pointerLength={props.pointerLength} fill={props.stroke} />,
    properties: [
      { name: 'stroke', label: 'Line Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 10 },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'pointerWidth', label: 'Arrow Width', type: 'range', min: 0, max: 20 },
      { name: 'pointerLength', label: 'Arrow Length', type: 'range', min: 0, max: 20 }
    ]
  },
  
  // CATEGORY B: Geometry Objects
  point: {
    id: 'point',
    category: 'Geometry',
    name: 'Point',
    icon: <Dot size={18} />,
    defaultProps: { radius: 4, fill: '#0f172a', stroke: '#0f172a', strokeWidth: 1, label: 'A', rotation: 0 },
    Component: ({ props }) => <Point radius={props.radius} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} label={props.label} />,
    properties: [
      { name: 'fill', label: 'Color', type: 'color' },
      { name: 'radius', label: 'Radius', type: 'range', min: 1, max: 20 },
      { name: 'label', label: 'Point Name', type: 'text' }
    ]
  },
  rightAngle: {
    id: 'rightAngle',
    category: 'Geometry',
    name: 'Right Angle',
    icon: <CornerRightDown size={18} />,
    defaultProps: { size: 15, stroke: '#334155', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <RightAngleMarker size={props.size} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 5 },
      { name: 'size', label: 'Size', type: 'range', min: 5, max: 50 }
    ]
  },
  congruentMarker: {
    id: 'congruentMarker',
    category: 'Geometry',
    name: 'Congruent Ticks',
    icon: <Tally2 size={18} />,
    defaultProps: { tickCount: 2, stroke: '#334155', strokeWidth: 2, spacing: 5, rotation: 0 },
    Component: ({ props }) => <CongruentMarker tickCount={props.tickCount} stroke={props.stroke} strokeWidth={props.strokeWidth} spacing={props.spacing} />,
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 5 },
      { name: 'tickCount', label: 'Ticks', type: 'range', min: 1, max: 4 },
      { name: 'spacing', label: 'Spacing', type: 'range', min: 2, max: 15 }
    ]
  },
  parallelMarker: {
    id: 'parallelMarker',
    category: 'Geometry',
    name: 'Parallel Arrows',
    icon: <ChevronsRight size={18} />,
    defaultProps: { arrowCount: 1, stroke: '#334155', strokeWidth: 2, spacing: 10, rotation: 0 },
    Component: ({ props }) => <ParallelMarker arrowCount={props.arrowCount} stroke={props.stroke} strokeWidth={props.strokeWidth} spacing={props.spacing} />,
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 5 },
      { name: 'arrowCount', label: 'Arrows', type: 'range', min: 1, max: 4 },
      { name: 'spacing', label: 'Spacing', type: 'range', min: 5, max: 20 }
    ]
  },
  angleMarker: {
    id: 'angleMarker',
    category: 'Geometry',
    name: 'Angle Marker',
    icon: <Scaling size={18} />,
    defaultProps: { radius: 50, angle: 45, stroke: '#10b981', strokeWidth: 3, label: 'θ', rotation: 0 },
    Component: ({ props }) => <AngleMarker radius={props.radius} angle={props.angle} stroke={props.stroke} strokeWidth={props.strokeWidth} label={props.label} />,
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 10 },
      { name: 'radius', label: 'Radius', type: 'range', min: 20, max: 200 },
      { name: 'angle', label: 'Angle', type: 'range', min: 0, max: 360 },
      { name: 'label', label: 'Label', type: 'text' }
    ]
  },
  compassArc: {
    id: 'compassArc',
    category: 'Geometry',
    name: 'Compass Arc',
    icon: <Compass size={18} />,
    defaultProps: { radius: 60, angle: 90, stroke: '#94a3b8', strokeWidth: 3, rotation: 0 },
    Component: ({ props }) => (
      <KonvaArc
        innerRadius={props.radius - 2}
        outerRadius={props.radius + 2}
        angle={props.angle}
        fill="transparent"
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
        rotationDeg={0}
      />
    ),
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 10 },
      { name: 'radius', label: 'Radius', type: 'range', min: 20, max: 200 },
      { name: 'angle', label: 'Arc Angle', type: 'range', min: 1, max: 360 }
    ]
  },
  numberline: {
    id: 'numberline',
    category: 'Number Lines',
    name: 'Number Line',
    icon: <RulerIcon size={18} />,
    defaultProps: { width: 400, stroke: '#94a3b8', strokeWidth: 3, min: -5, max: 5, isOpen: false, step: 1, jumpCount: 0, jumpSize: 1, labelMode: 'integer', rotation: 0 },
    Component: ({ props }) => <NumberLine width={props.width} stroke={props.stroke} strokeWidth={props.strokeWidth} min={props.min} max={props.max} isOpen={props.isOpen} step={props.step} jumpCount={props.jumpCount} jumpSize={props.jumpSize} labelMode={props.labelMode} />,
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 10 },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'min', label: 'Min Value', type: 'number' },
      { name: 'max', label: 'Max Value', type: 'number' },
      { name: 'step', label: 'Interval Step', type: 'number' },
      { name: 'jumpCount', label: 'Number of Jumps', type: 'range', min: 0, max: 20 },
      { name: 'jumpSize', label: 'Jump Size', type: 'number' }
    ]
  },

  // CATEGORY C: Triangles
  rightTriangle: {
    id: 'rightTriangle',
    category: 'Triangles',
    name: 'Right Triangle',
    icon: <Triangle size={18} style={{ transform: 'rotate(180deg)' }} />,
    defaultProps: { base: 100, height: 100, fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <RightTriangle base={props.base} height={props.height} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Fill Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 0, max: 10 },
      { name: 'base', label: 'Base Length', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' }
    ]
  },
  isoscelesTriangle: {
    id: 'isoscelesTriangle',
    category: 'Triangles',
    name: 'Isosceles Triangle',
    icon: <Triangle size={18} />,
    defaultProps: { base: 120, height: 100, fill: '#10b981', stroke: '#059669', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <IsoscelesTriangle base={props.base} height={props.height} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Fill Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 0, max: 10 },
      { name: 'base', label: 'Base Length', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' }
    ]
  },
  equilateralTriangle: {
    id: 'equilateralTriangle',
    category: 'Triangles',
    name: 'Equilateral Triangle',
    icon: <Triangle size={18} style={{ transform: 'rotate(180deg)' }} />,
    defaultProps: { sideLength: 120, fill: '#f97316', stroke: '#ea580c', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <EquilateralTriangle sideLength={props.sideLength} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Fill Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 0, max: 10 },
      { name: 'sideLength', label: 'Side Length', type: 'number' }
    ]
  },

  // CATEGORY E: Fraction Models
  fractionRectangle: {
    id: 'fractionRectangle',
    category: 'Fractions',
    name: 'Fraction Rectangle',
    icon: <LayoutGrid size={18} />,
    defaultProps: { width: 150, height: 100, rows: 2, cols: 3, shaded: 2, fill: '#3b82f6', stroke: '#334155', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <FractionRectangle width={props.width} height={props.height} rows={props.rows} cols={props.cols} shaded={props.shaded} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Shaded Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 1, max: 10 },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'rows', label: 'Rows', type: 'range', min: 1, max: 10 },
      { name: 'cols', label: 'Columns', type: 'range', min: 1, max: 10 },
      { name: 'shaded', label: 'Shaded Cells', type: 'range', min: 0, max: 100 }
    ]
  },
  fractionCircle: {
    id: 'fractionCircle',
    category: 'Fractions',
    name: 'Fraction Circle',
    icon: <PieChart size={18} />,
    defaultProps: { radius: 60, sectors: 4, shaded: 1, fill: '#3b82f6', stroke: '#334155', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <FractionCircle radius={props.radius} sectors={props.sectors} shaded={props.shaded} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Shaded Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 1, max: 10 },
      { name: 'radius', label: 'Radius', type: 'number' },
      { name: 'sectors', label: 'Total Sectors', type: 'range', min: 2, max: 20 },
      { name: 'shaded', label: 'Shaded Sectors', type: 'range', min: 0, max: 20 }
    ]
  },
  fractionBar: {
    id: 'fractionBar',
    category: 'Fractions',
    name: 'Fraction Bar',
    icon: <SquareSplitHorizontal size={18} />,
    defaultProps: { width: 200, height: 40, partitions: 5, shaded: 3, fill: '#3b82f6', stroke: '#334155', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <FractionBar width={props.width} height={props.height} partitions={props.partitions} shaded={props.shaded} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Shaded Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 1, max: 10 },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'partitions', label: 'Partitions', type: 'range', min: 1, max: 20 },
      { name: 'shaded', label: 'Shaded Partitions', type: 'range', min: 0, max: 20 }
    ]
  },

  // CATEGORY G: Measurement
  lengthMarker: {
    id: 'lengthMarker',
    category: 'Measurement',
    name: 'Length Marker',
    icon: <MoveHorizontal size={18} />,
    defaultProps: { length: 200, label: '5 cm', stroke: '#334155', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <LengthMarker length={props.length} label={props.label} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 5 },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'label', label: 'Label', type: 'text' }
    ]
  },
  ruler: {
    id: 'ruler',
    category: 'Measurement',
    name: 'Ruler',
    icon: <RulerIcon size={18} />,
    defaultProps: { length: 300, units: 10, fill: '#fef08a', stroke: '#334155', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <Ruler length={props.length} units={props.units} fill={props.fill} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'fill', label: 'Fill Color', type: 'color' },
      { name: 'stroke', label: 'Tick Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Width', type: 'range', min: 1, max: 5 },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'units', label: 'Units', type: 'range', min: 1, max: 30 }
    ]
  },

  // CATEGORY H: Graphs & Data
  barGraph: {
    id: 'barGraph',
    category: 'Graphs & Data',
    name: 'Bar Graph',
    icon: <BarChart3 size={18} />,
    defaultProps: { 
      width: 300, 
      height: 200, 
      bars: [
        { id: 'b1', value: 5, color: '#3b82f6' },
        { id: 'b2', value: 8, color: '#ef4444' },
        { id: 'b3', value: 3, color: '#22c55e' },
        { id: 'b4', value: 10, color: '#f97316' }
      ],
      stroke: '#334155', 
      strokeWidth: 2, 
      yAxisMax: 10, 
      rotation: 0 
    },
    Component: ({ props }) => <BarGraph width={props.width} height={props.height} bars={props.bars} stroke={props.stroke} strokeWidth={props.strokeWidth} yAxisMax={props.yAxisMax} />,
    properties: [
      { name: 'stroke', label: 'Axis/Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Axis Thickness', type: 'range', min: 1, max: 5 },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'yAxisMax', label: 'Y-Axis Max', type: 'number' }
    ]
  },
  dataTable: {
    id: 'dataTable',
    category: 'Graphs & Data',
    name: 'Data Table',
    icon: <Table size={18} />,
    defaultProps: { width: 300, height: 150, rows: 4, cols: 2, headerColor: '#cbd5e1', stroke: '#334155', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <DataTable width={props.width} height={props.height} rows={props.rows} cols={props.cols} headerColor={props.headerColor} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'headerColor', label: 'Header Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Thickness', type: 'range', min: 1, max: 5 },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'rows', label: 'Rows', type: 'range', min: 1, max: 20 },
      { name: 'cols', label: 'Columns', type: 'range', min: 1, max: 10 }
    ]
  },

  // CATEGORY I: Coordinate Geometry
  cartesianPlane: {
    id: 'cartesianPlane',
    category: 'Coordinate Geometry',
    name: 'Cartesian Plane',
    icon: <Grid size={18} />,
    defaultProps: { 
      width: 300, 
      height: 300, 
      domain: 5, 
      range: 5, 
      step: 1, 
      showGrid: true, 
      showLabels: true, 
      stroke: '#334155', 
      strokeWidth: 2, 
      plots: [], 
      rotation: 0 
    },
    Component: ({ props }) => <CartesianPlane width={props.width} height={props.height} domain={props.domain} range={props.range} step={props.step} showGrid={props.showGrid} showLabels={props.showLabels} stroke={props.stroke} strokeWidth={props.strokeWidth} plots={props.plots} />,
    properties: [
      { name: 'stroke', label: 'Axis Color', type: 'color' },
      { name: 'strokeWidth', label: 'Axis Thickness', type: 'range', min: 1, max: 5 },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'domain', label: 'X Max (+/-)', type: 'number' },
      { name: 'range', label: 'Y Max (+/-)', type: 'number' },
      { name: 'step', label: 'Grid Step', type: 'number' }
    ]
  },
  gridMap: {
    id: 'gridMap',
    category: 'Coordinate Geometry',
    name: 'Grid Map Maker',
    icon: <MapIcon size={18} />,
    defaultProps: { 
      width: 320, 
      height: 320, 
      rows: 4, 
      cols: 4, 
      showCompass: true, 
      scaleText: '1 square = 100m', 
      landmarks: [
        { id: 'lm1', row: 1, col: 1, label: 'School', icon: 'School', color: '#3b82f6' },
        { id: 'lm2', row: 4, col: 4, label: 'House', icon: 'Dice5', color: '#ef4444' }
      ], 
      routes: [
        { id: 'rt1', path: 'A1-A4-D4', color: '#f59e0b' }
      ], 
      stroke: '#94a3b8', 
      rotation: 0 
    },
    Component: ({ props }) => (
      <GridMap 
        width={props.width} 
        height={props.height} 
        rows={props.rows} 
        cols={props.cols} 
        showCompass={props.showCompass} 
        scaleText={props.scaleText} 
        landmarks={props.landmarks} 
        routes={props.routes} 
        stroke={props.stroke} 
      />
    ),
    properties: [
      { name: 'stroke', label: 'Grid Color', type: 'color' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'rows', label: 'Rows', type: 'range', min: 2, max: 10 },
      { name: 'cols', label: 'Columns', type: 'range', min: 2, max: 10 },
      { name: 'scaleText', label: 'Map Scale', type: 'text' }
    ]
  },
  mapMarker: {
    id: 'mapMarker',
    category: 'Map Elements',
    name: 'Map Marker',
    icon: <MapPin size={18} />,
    defaultProps: { 
      radius: 25, 
      color: "#ef4444", 
      label: "Start", 
      iconName: "MapPin", 
      showLabel: true,
      rotation: 0 
    },
    Component: ({ props }) => (
      <MapMarker 
        radius={props.radius} 
        color={props.color} 
        label={props.label} 
        iconName={props.iconName}
        showLabel={props.showLabel} 
      />
    ),
    properties: [
      { name: 'color', label: 'Marker Color', type: 'color' },
      { name: 'radius', label: 'Marker Size', type: 'range', min: 10, max: 60 },
      { name: 'label', label: 'Marker Label', type: 'text' }
    ]
  },
  mapBuilding: {
    id: 'mapBuilding',
    category: 'Map Elements',
    name: 'Map Building',
    icon: <Building2 size={18} />,
    defaultProps: { 
      width: 80, 
      height: 60, 
      fill: "#3b82f6", 
      stroke: "#1d4ed8", 
      strokeWidth: 2,
      label: "School",
      iconName: "School",
      showLabel: true,
      rotation: 0 
    },
    Component: ({ props }) => (
      <MapBuilding 
        width={props.width} 
        height={props.height} 
        fill={props.fill} 
        stroke={props.stroke} 
        strokeWidth={props.strokeWidth}
        label={props.label}
        iconName={props.iconName}
        showLabel={props.showLabel} 
      />
    ),
    properties: [
      { name: 'fill', label: 'Fill Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'label', label: 'Building Label', type: 'text' }
    ]
  },
  road: {
    id: 'road',
    category: 'Map Elements',
    name: 'Road',
    icon: <MapIcon size={18} />,
    defaultProps: { 
      width: 200, 
      height: 40, 
      fill: "#475569", 
      lineColor: "#fbbf24",
      rotation: 0 
    },
    Component: ({ props }) => (
      <Road 
        width={props.width} 
        height={props.height} 
        fill={props.fill} 
        lineColor={props.lineColor} 
      />
    ),
    properties: [
      { name: 'fill', label: 'Road Color', type: 'color' },
      { name: 'lineColor', label: 'Line Color', type: 'color' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' }
    ]
  },
  tree: {
    id: 'tree',
    category: 'Map Elements',
    name: 'Tree',
    icon: <TreePine size={18} />,
    defaultProps: { 
      trunkWidth: 15, 
      trunkHeight: 40, 
      canopyRadius: 30, 
      trunkColor: "#92400e", 
      canopyColor: "#15803d",
      rotation: 0 
    },
    Component: ({ props }) => (
      <Tree 
        trunkWidth={props.trunkWidth} 
        trunkHeight={props.trunkHeight} 
        canopyRadius={props.canopyRadius} 
        trunkColor={props.trunkColor} 
        canopyColor={props.canopyColor} 
      />
    ),
    properties: [
      { name: 'trunkColor', label: 'Trunk Color', type: 'color' },
      { name: 'canopyColor', label: 'Canopy Color', type: 'color' },
      { name: 'canopyRadius', label: 'Tree Size', type: 'range', min: 10, max: 80 }
    ]
  },
  river: {
    id: 'river',
    category: 'Map Elements',
    name: 'River',
    icon: <MapIcon size={18} />,
    defaultProps: {
      length: 200,
      width: 30,
      color: '#3b82f6',
      strokeWidth: 2,
      rotation: 0
    },
    Component: ({ props }) => (
      <River
        length={props.length}
        width={props.width}
        color={props.color}
        strokeWidth={props.strokeWidth}
      />
    ),
    properties: [
      { name: 'color', label: 'River Color', type: 'color' },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'width', label: 'Width', type: 'number' }
    ]
  },
  lake: {
    id: 'lake',
    category: 'Map Elements',
    name: 'Lake',
    icon: <Circle size={18} />,
    defaultProps: {
      radius: 60,
      color: '#3b82f6',
      stroke: '#1d4ed8',
      strokeWidth: 3,
      rotation: 0
    },
    Component: ({ props }) => (
      <Lake
        radius={props.radius}
        color={props.color}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
      />
    ),
    properties: [
      { name: 'color', label: 'Lake Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'radius', label: 'Size', type: 'range', min: 20, max: 150 }
    ]
  },
  sea: {
    id: 'sea',
    category: 'Map Elements',
    name: 'Sea',
    icon: <MapIcon size={18} />,
    defaultProps: {
      width: 300,
      height: 200,
      color: '#3b82f6',
      stroke: '#1d4ed8',
      strokeWidth: 3,
      rotation: 0
    },
    Component: ({ props }) => (
      <Sea
        width={props.width}
        height={props.height}
        color={props.color}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
      />
    ),
    properties: [
      { name: 'color', label: 'Sea Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' }
    ]
  },
  mountain: {
    id: 'mountain',
    category: 'Map Elements',
    name: 'Mountain',
    icon: <Triangle size={18} />,
    defaultProps: {
      width: 100,
      height: 80,
      color: '#94a3b8',
      stroke: '#64748b',
      strokeWidth: 2,
      rotation: 0
    },
    Component: ({ props }) => (
      <Mountain
        width={props.width}
        height={props.height}
        color={props.color}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
      />
    ),
    properties: [
      { name: 'color', label: 'Mountain Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' }
    ]
  },
  bridge: {
    id: 'bridge',
    category: 'Map Elements',
    name: 'Bridge',
    icon: <Minus size={18} />,
    defaultProps: {
      length: 120,
      width: 30,
      color: '#f59e0b',
      stroke: '#d97706',
      strokeWidth: 2,
      rotation: 0
    },
    Component: ({ props }) => (
      <Bridge
        length={props.length}
        width={props.width}
        color={props.color}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
      />
    ),
    properties: [
      { name: 'color', label: 'Bridge Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'width', label: 'Width', type: 'number' }
    ]
  },
  footpath: {
    id: 'footpath',
    category: 'Map Elements',
    name: 'Footpath',
    icon: <Minus size={18} />,
    defaultProps: {
      length: 150,
      width: 10,
      color: '#fef3c7',
      stroke: '#d97706',
      strokeWidth: 1,
      rotation: 0
    },
    Component: ({ props }) => (
      <Footpath
        length={props.length}
        width={props.width}
        color={props.color}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
      />
    ),
    properties: [
      { name: 'color', label: 'Footpath Color', type: 'color' },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'width', label: 'Width', type: 'number' }
    ]
  },
  playground: {
    id: 'playground',
    category: 'Map Elements',
    name: 'Playground',
    icon: <Heart size={18} />,
    defaultProps: {
      width: 120,
      height: 100,
      color: '#22c55e',
      stroke: '#16a34a',
      strokeWidth: 2,
      iconName: 'Heart',
      rotation: 0
    },
    Component: ({ props }) => (
      <Playground
        width={props.width}
        height={props.height}
        color={props.color}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
        iconName={props.iconName}
      />
    ),
    properties: [
      { name: 'color', label: 'Playground Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' }
    ]
  },
  airport: {
    id: 'airport',
    category: 'Map Elements',
    name: 'Airport',
    icon: <Car size={18} />,
    defaultProps: {
      width: 150,
      height: 100,
      color: '#64748b',
      stroke: '#475569',
      strokeWidth: 2,
      iconName: 'Car',
      rotation: 0
    },
    Component: ({ props }) => (
      <Airport
        width={props.width}
        height={props.height}
        color={props.color}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
        iconName={props.iconName}
      />
    ),
    properties: [
      { name: 'color', label: 'Airport Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' }
    ]
  },
  port: {
    id: 'port',
    category: 'Map Elements',
    name: 'Port',
    icon: <MapIcon size={18} />,
    defaultProps: {
      width: 120,
      height: 80,
      color: '#94a3b8',
      stroke: '#64748b',
      strokeWidth: 2,
      iconName: 'Car',
      rotation: 0
    },
    Component: ({ props }) => (
      <Port
        width={props.width}
        height={props.height}
        color={props.color}
        stroke={props.stroke}
        strokeWidth={props.strokeWidth}
        iconName={props.iconName}
      />
    ),
    properties: [
      { name: 'color', label: 'Port Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' }
    ]
  },
  sunDirection: {
    id: 'sunDirection',
    category: 'Map Elements',
    name: 'Sun Direction',
    icon: <Sun size={18} />,
    defaultProps: {
      radius: 40,
      color: '#fbbf24',
      label: 'N',
      rotation: 0
    },
    Component: ({ props }) => (
      <SunDirection
        radius={props.radius}
        color={props.color}
        label={props.label}
      />
    ),
    properties: [
      { name: 'color', label: 'Sun Color', type: 'color' },
      { name: 'radius', label: 'Size', type: 'range', min: 20, max: 100 },
      { name: 'label', label: 'Direction Label', type: 'text' }
    ]
  },
  flag: {
    id: 'flag',
    category: 'Map Elements',
    name: 'Flag',
    icon: <Flag size={18} />,
    defaultProps: {
      radius: 25,
      color: "#ef4444",
      label: "Flag",
      iconName: "Flag",
      showLabel: true,
      rotation: 0
    },
    Component: ({ props }) => (
      <FlagComponent
        radius={props.radius}
        color={props.color}
        label={props.label}
        showLabel={props.showLabel}
      />
    ),
    properties: [
      { name: 'color', label: 'Flag Color', type: 'color' },
      { name: 'radius', label: 'Size', type: 'range', min: 10, max: 60 },
      { name: 'label', label: 'Label', type: 'text' }
    ]
  },
  compassRose: {
    id: 'compassRose',
    category: 'Map Elements',
    name: 'Compass Rose',
    icon: <Compass size={18} />,
    defaultProps: {
      radius: 60,
      color: "#475569",
      fill: "#94a3b8",
      fontSize: 16,
      rotation: 0
    },
    Component: ({ props }) => (
      <CompassRose
        radius={props.radius}
        color={props.color}
        fill={props.fill}
        fontSize={props.fontSize}
      />
    ),
    properties: [
      { name: 'color', label: 'Color', type: 'color' },
      { name: 'fill', label: 'Fill', type: 'color' },
      { name: 'radius', label: 'Size', type: 'range', min: 30, max: 150 }
    ]
  },
  scaleBar: {
    id: 'scaleBar',
    category: 'Map Elements',
    name: 'Scale Bar',
    icon: <RulerIcon size={18} />,
    defaultProps: {
      width: 200,
      height: 20,
      color: "#475569",
      unitText: "100m",
      fontSize: 14,
      rotation: 0
    },
    Component: ({ props }) => (
      <ScaleBar
        width={props.width}
        height={props.height}
        color={props.color}
        unitText={props.unitText}
        fontSize={props.fontSize}
      />
    ),
    properties: [
      { name: 'color', label: 'Color', type: 'color' },
      { name: 'width', label: 'Length', type: 'number' },
      { name: 'unitText', label: 'Unit', type: 'text' }
    ]
  },


  // CATEGORY K: Arrows
  straightArrow: {
    id: 'straightArrow',
    category: 'Arrows',
    name: 'Straight Arrow',
    icon: <ArrowRight size={18} />,
    defaultProps: { length: 150, stroke: '#334155', strokeWidth: 4, pointerWidth: 10, pointerLength: 10, rotation: 0 },
    Component: ({ props }) => <KonvaArrow points={[0, 0, props.length, 0]} stroke={props.stroke} strokeWidth={props.strokeWidth} pointerWidth={props.pointerWidth} pointerLength={props.pointerLength} fill={props.stroke} />,
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 10 },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'pointerWidth', label: 'Arrow Width', type: 'range', min: 1, max: 30 },
      { name: 'pointerLength', label: 'Arrow Length', type: 'range', min: 1, max: 30 }
    ]
  },
  doubleArrow: {
    id: 'doubleArrow',
    category: 'Arrows',
    name: 'Double Arrow',
    icon: <ArrowLeftRight size={18} />,
    defaultProps: { length: 150, stroke: '#334155', strokeWidth: 4, pointerWidth: 10, pointerLength: 10, rotation: 0 },
    Component: ({ props }) => (
      <React.Fragment>
        <KonvaArrow points={[props.length/2, 0, props.length, 0]} stroke={props.stroke} strokeWidth={props.strokeWidth} pointerWidth={props.pointerWidth} pointerLength={props.pointerLength} fill={props.stroke} />
        <KonvaArrow points={[props.length/2, 0, 0, 0]} stroke={props.stroke} strokeWidth={props.strokeWidth} pointerWidth={props.pointerWidth} pointerLength={props.pointerLength} fill={props.stroke} />
      </React.Fragment>
    ),
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 10 },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'pointerWidth', label: 'Arrow Width', type: 'range', min: 1, max: 30 },
      { name: 'pointerLength', label: 'Arrow Length', type: 'range', min: 1, max: 30 }
    ]
  },
  curvedArrow: {
    id: 'curvedArrow',
    category: 'Arrows',
    name: 'Curved Arrow',
    icon: <Navigation size={18} />,
    defaultProps: { length: 150, curveOffset: -50, stroke: '#334155', strokeWidth: 4, pointerWidth: 10, pointerLength: 10, rotation: 0 },
    Component: ({ props }) => <KonvaArrow points={[0, 0, props.length/2, props.curveOffset, props.length, 0]} tension={0.5} stroke={props.stroke} strokeWidth={props.strokeWidth} pointerWidth={props.pointerWidth} pointerLength={props.pointerLength} fill={props.stroke} />,
    properties: [
      { name: 'stroke', label: 'Color', type: 'color' },
      { name: 'strokeWidth', label: 'Thickness', type: 'range', min: 1, max: 10 },
      { name: 'length', label: 'Length', type: 'number' },
      { name: 'curveOffset', label: 'Curve Amount', type: 'range', min: -150, max: 150 },
      { name: 'pointerWidth', label: 'Arrow Width', type: 'range', min: 1, max: 30 },
      { name: 'pointerLength', label: 'Arrow Length', type: 'range', min: 1, max: 30 }
    ]
  },

  // CATEGORY L: Logic

  vennDiagram: {
    id: 'vennDiagram',
    category: 'Logic & Problem Solving',
    name: 'Venn Diagram',
    icon: <CircleDashed size={18} />,
    defaultProps: { radius: 80, overlap: 60, leftLabel: 'Set A', rightLabel: 'Set B', leftColor: '#3b82f6', rightColor: '#ef4444', stroke: '#334155', strokeWidth: 2, rotation: 0 },
    Component: ({ props }) => <VennDiagram radius={props.radius} overlap={props.overlap} leftLabel={props.leftLabel} rightLabel={props.rightLabel} leftColor={props.leftColor} rightColor={props.rightColor} stroke={props.stroke} strokeWidth={props.strokeWidth} />,
    properties: [
      { name: 'leftColor', label: 'Left Set Color', type: 'color' },
      { name: 'rightColor', label: 'Right Set Color', type: 'color' },
      { name: 'stroke', label: 'Border Color', type: 'color' },
      { name: 'strokeWidth', label: 'Border Thickness', type: 'range', min: 1, max: 5 },
      { name: 'radius', label: 'Circle Radius', type: 'number' },
      { name: 'overlap', label: 'Overlap Distance', type: 'number' },
      { name: 'leftLabel', label: 'Left Label', type: 'text' },
      { name: 'rightLabel', label: 'Right Label', type: 'text' }
    ]
  },

  // CATEGORY M: Text
  text: {
    id: 'text',
    category: 'Text & Annotation',
    name: 'Plain Text',
    icon: <Type size={18} />,
    defaultProps: { text: 'Math Text', fontSize: 24, fill: '#f8fafc', fontFamily: 'Inter', rotation: 0 },
    Component: ({ props }) => <KonvaText text={props.text} fontSize={props.fontSize} fill={props.fill} fontFamily={props.fontFamily} />,
    properties: [
      { name: 'text', label: 'Text Content', type: 'text' },
      { name: 'fontFamily', label: 'Font Family', type: 'select', options: FONT_PRESETS },
      { name: 'fontSize', label: 'Font Size', type: 'range', min: 10, max: 100 },
      { name: 'fill', label: 'Color', type: 'color' }
    ]
  },

  // CATEGORY N: Images & Icons
  imageIcon: {
    id: 'imageIcon',
    category: 'Images & Icons',
    name: 'Image / Icon',
    icon: <ImageIcon size={18} />,
    defaultProps: { iconName: 'Calculator', color: '#3b82f6', url: '', width: 80, height: 80, opacity: 1, rotation: 0 },
    Component: ({ props }) => <MathIcon url={props.url} iconName={props.iconName} color={props.color} width={props.width} height={props.height} opacity={props.opacity} rotation={props.rotation} />,
    properties: [
      { name: 'color', label: 'Icon Color', type: 'color' },
      { name: 'url', label: 'Or Custom Image URL', type: 'text' },
      { name: 'width', label: 'Width', type: 'number' },
      { name: 'height', label: 'Height', type: 'number' },
      { name: 'opacity', label: 'Opacity', type: 'range', min: 0.1, max: 1, step: 0.1 }
    ]
  }
};

export const getCategories = () => {
  const categories = {};
  Object.values(ObjectRegistry).forEach(obj => {
    if (!categories[obj.category]) categories[obj.category] = [];
    categories[obj.category].push(obj);
  });
  return categories;
};
