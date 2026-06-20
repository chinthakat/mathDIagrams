const fs=require('fs'); 
let code=fs.readFileSync('src/registry/objectRegistry.jsx', 'utf8'); 
const updates={
  'mapMarker':'Icons & Markers', 
  'mapBuilding':'Buildings', 
  'road':'Roads & Paths', 
  'tree':'Nature & Water', 
  'river':'Nature & Water', 
  'lake':'Nature & Water', 
  'sea':'Nature & Water', 
  'mountain':'Nature & Water', 
  'bridge':'Roads & Paths', 
  'footpath':'Roads & Paths', 
  'playground':'Buildings', 
  'airport':'Buildings', 
  'port':'Buildings', 
  'sunDirection':'Icons & Markers', 
  'flag':'Icons & Markers', 
  'compassRose':'Icons & Markers', 
  'scaleBar':'Icons & Markers', 
  'mapSprite':'Icons & Markers'
}; 
for(const [id, cat] of Object.entries(updates)){ 
  code = code.replace(new RegExp(`(id:\\s*'${id}',\\s*\\n\\s*category:\\s*)'Map Elements'`), `$1'${cat}'`); 
} 

// Add RoadJunction import if not exists
if (!code.includes('import RoadJunction from')) {
  code = code.replace(
    "import Road from '../components/MathObjects/Road';",
    "import Road from '../components/MathObjects/Road';\nimport RoadJunction from '../components/MathObjects/RoadJunction';"
  );
}

// Add roadJunction to registry under Roads & Paths
if (!code.includes("id: 'roadJunction'")) {
  const roadJunctionDef = `
  roadJunction: {
    id: 'roadJunction',
    category: 'Roads & Paths',
    name: 'Road Junction',
    icon: <MapIcon size={18} />,
    defaultProps: { junctionType: 'cross', size: 150, fill: '#334155', lineColor: '#fbbf24', rotation: 0 },
    Component: ({ props }) => <RoadJunction junctionType={props.junctionType} size={props.size} fill={props.fill} lineColor={props.lineColor} />,
    properties: [
      { name: 'junctionType', label: 'Junction Type', type: 'select', options: [{value: 'cross', label: 'Cross'}, {value: 't-junction', label: 'T-Junction'}, {value: 'y-junction', label: 'Y-Junction'}, {value: 'roundabout', label: 'Roundabout'}] },
      { name: 'fill', label: 'Asphalt Color', type: 'color' },
      { name: 'lineColor', label: 'Line Color', type: 'color' },
      { name: 'size', label: 'Size', type: 'number' }
    ]
  },
`;
  code = code.replace(
    "export const ObjectRegistry = {",
    "export const ObjectRegistry = {" + roadJunctionDef
  );
}

fs.writeFileSync('src/registry/objectRegistry.jsx', code);
