import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  Calculator, Ruler, Compass, Scissors, Pencil, Eraser, PenTool, Paintbrush, Highlighter,
  Square, Circle, Triangle, Hexagon, Octagon, Box, Cylinder, Grid, Network, Orbit,
  BarChart3, LineChart, PieChart, AreaChart, TrendingUp, Table, Activity, Percent,
  Brain, BookOpen, GraduationCap, Globe, Atom, FlaskConical, Dna, Microscope, Library, School, Trophy, Medal,
  Sparkles, Lightbulb, Hash, Binary, Divide, Equal, Plus, Minus, Sigma, Infinity,
  Flag, Apple, HelpCircle, Sun, Moon, Star, Heart, Smile, Car, MapPin, Map, Route, Footprints, Leaf, Flower, Cloud, Coins, Dice5, Navigation,
  Building2, Home, Hospital, Store, TreePine, Mountain, Road, Crosshair, Zap, Coffee, Utensils, BookOpenCheck, Mailbox
} from 'lucide-react';

export const ICON_CATEGORIES = {
  'Primary Maths & Counting': [
    { name: 'Apple', component: Apple },
    { name: 'Star', component: Star },
    { name: 'Smile', component: Smile },
    { name: 'Heart', component: Heart },
    { name: 'Dice5', component: Dice5 },
    { name: 'Coins', component: Coins },
    { name: 'Flag', component: Flag },
    { name: 'QuestionMark', component: HelpCircle },
    { name: 'Trophy', component: Trophy },
    { name: 'Medal', component: Medal },
    { name: 'Sparkles', component: Sparkles },
    { name: 'Lightbulb', component: Lightbulb }
  ],
  'Maps & Directions': [
    { name: 'DirectionArrow', component: Navigation },
    { name: 'Compass', component: Compass },
    { name: 'MapPin', component: MapPin },
    { name: 'Map', component: Map },
    { name: 'Route', component: Route },
    { name: 'Footprints', component: Footprints },
    { name: 'Car', component: Car },
    { name: 'Building', component: Building2 },
    { name: 'Home', component: Home },
    { name: 'Hospital', component: Hospital },
    { name: 'Store', component: Store },
    { name: 'Tree', component: TreePine },
    { name: 'Mountain', component: Mountain },
    { name: 'Road', component: Road },
    { name: 'Crosshair', component: Crosshair },
    { name: 'Coffee', component: Coffee },
    { name: 'Restaurant', component: Utensils },
    { name: 'Library', component: BookOpenCheck },
    { name: 'Mailbox', component: Mailbox }
  ],
  'Patterns & Nature': [
    { name: 'Sun', component: Sun },
    { name: 'Moon', component: Moon },
    { name: 'Cloud', component: Cloud },
    { name: 'Leaf', component: Leaf },
    { name: 'Flower', component: Flower },
    { name: 'Globe', component: Globe }
  ],
  'Math Tools': [
    { name: 'Calculator', component: Calculator },
    { name: 'Ruler', component: Ruler },
    { name: 'Pencil', component: Pencil },
    { name: 'Eraser', component: Eraser },
    { name: 'PenTool', component: PenTool },
    { name: 'Highlighter', component: Highlighter },
    { name: 'Scissors', component: Scissors },
    { name: 'Hash', component: Hash },
    { name: 'Binary', component: Binary },
    { name: 'Percent', component: Percent }
  ],
  'Shapes & Geometry': [
    { name: 'Square', component: Square },
    { name: 'Circle', component: Circle },
    { name: 'Triangle', component: Triangle },
    { name: 'Hexagon', component: Hexagon },
    { name: 'Octagon', component: Octagon },
    { name: 'Box', component: Box },
    { name: 'Cylinder', component: Cylinder },
    { name: 'Grid', component: Grid },
    { name: 'Network', component: Network },
    { name: 'Orbit', component: Orbit }
  ],
  'Equations & Operators': [
    { name: 'Sigma', component: Sigma },
    { name: 'Infinity', component: Infinity },
    { name: 'Plus', component: Plus },
    { name: 'Minus', component: Minus },
    { name: 'Divide', component: Divide },
    { name: 'Equal', component: Equal }
  ],
  'Charts & Data': [
    { name: 'BarChart3', component: BarChart3 },
    { name: 'LineChart', component: LineChart },
    { name: 'PieChart', component: PieChart },
    { name: 'AreaChart', component: AreaChart },
    { name: 'TrendingUp', component: TrendingUp },
    { name: 'Table', component: Table },
    { name: 'Activity', component: Activity }
  ]
};

export const ALL_ICONS = Object.values(ICON_CATEGORIES).flat();

export const GET_ICON = (name) => {
  const matched = ALL_ICONS.find(i => i.name === name);
  return matched ? matched.component : null;
};

export const getSvgIconDataUrl = (name, strokeColor = '#3b82f6') => {
  const IconComponent = GET_ICON(name);
  if (!IconComponent) return null;
  
  // Render standard Lucide icon component to a static markup string
  const svgString = renderToStaticMarkup(
    <IconComponent stroke={strokeColor} size={48} strokeWidth={2} />
  );
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};
