export const MapTemplates = [
  {
    id: 'pirate_map',
    name: 'Pirate Island Map',
    shapes: [
      { id: 'sea1', type: 'sea', x: 400, y: 300, width: 800, height: 600, color: '#38bdf8', stroke: '#0284c7' },
      { id: 'island_base', type: 'aiTerrain', x: 400, y: 300, width: 600, height: 400, terrainType: 'island', shape: 'organic', count: '1', features: 'Sandy beaches, central mountain' },
      { id: 'ship', type: 'mapSprite', spriteName: 'pirate_ship', x: 150, y: 100, width: 80, height: 80 },
      { id: 'chest', type: 'mapSprite', spriteName: 'treasure_chest', x: 550, y: 350, width: 64, height: 64 },
      { id: 'skull1', type: 'mapSprite', spriteName: 'skull_marker', x: 250, y: 400, width: 64, height: 64 },
      { id: 'grid', type: 'gridMap', x: 400, y: 300, width: 600, height: 400, rows: 5, cols: 6, showCompass: true, scaleText: "1 square = 10 miles", stroke: '#b45309' }
    ]
  },
  {
    id: 'community_town',
    name: 'Community Layout Map',
    shapes: [
      { id: 'grass', type: 'rectangle', x: 400, y: 300, width: 800, height: 600, fill: '#bbf7d0', stroke: '#86efac', strokeWidth: 0 },
      { id: 'road_main', type: 'road', x: 400, y: 250, width: 800, height: 60, fill: '#475569', lineColor: '#fbbf24' },
      { id: 'road_cross', type: 'road', x: 350, y: 300, width: 60, height: 600, fill: '#475569', lineColor: '#fbbf24' },
      { id: 'lake1', type: 'lake', x: 150, y: 150, radius: 70, color: '#3b82f6' },
      { id: 'school', type: 'mapBuilding', x: 500, y: 150, width: 120, height: 80, label: 'School', iconName: 'School', fill: '#ef4444' },
      { id: 'library', type: 'mapBuilding', x: 500, y: 400, width: 100, height: 80, label: 'Library', iconName: 'Library', fill: '#3b82f6' },
      { id: 'swings', type: 'mapSprite', spriteName: 'swings', x: 200, y: 450, width: 80, height: 80 },
      { id: 'slide', type: 'mapSprite', spriteName: 'slide', x: 100, y: 500, width: 80, height: 80 },
      { id: 'tree1', type: 'tree', x: 650, y: 200, trunkWidth: 15, trunkHeight: 30, canopyRadius: 40 },
      { id: 'tree2', type: 'tree', x: 730, y: 230, trunkWidth: 15, trunkHeight: 30, canopyRadius: 30 },
      { id: 'compass', type: 'compassRose', x: 700, y: 80, radius: 40 }
    ]
  },
  {
    id: 'city_directions',
    name: 'City Directions Map',
    shapes: [
      { id: 'concrete', type: 'rectangle', x: 400, y: 300, width: 800, height: 600, fill: '#e2e8f0', stroke: '#cbd5e1', strokeWidth: 0 },
      { id: 'road_h1', type: 'road', x: 400, y: 200, width: 800, height: 80, fill: '#334155', lineColor: '#fff' },
      { id: 'road_h2', type: 'road', x: 400, y: 450, width: 800, height: 80, fill: '#334155', lineColor: '#fff' },
      { id: 'road_v1', type: 'road', x: 250, y: 300, width: 80, height: 600, fill: '#334155', lineColor: '#fff' },
      { id: 'road_v2', type: 'road', x: 550, y: 300, width: 80, height: 600, fill: '#334155', lineColor: '#fff' },
      
      { id: 'junc_1', type: 'roadJunction', x: 250, y: 200, size: 80, junctionType: 'cross', fill: '#334155' },
      { id: 'junc_2', type: 'roadJunction', x: 550, y: 200, size: 80, junctionType: 'cross', fill: '#334155' },
      { id: 'junc_3', type: 'roadJunction', x: 250, y: 450, size: 80, junctionType: 'cross', fill: '#334155' },
      { id: 'junc_4', type: 'roadJunction', x: 550, y: 450, size: 80, junctionType: 'cross', fill: '#334155' },

      { id: 'awning1', type: 'mapSprite', spriteName: 'storefront_awning', x: 100, y: 80, width: 100, height: 30 },
      { id: 'bakery', type: 'mapBuilding', x: 100, y: 110, width: 100, height: 70, label: 'Bakery', iconName: 'Store', fill: '#f59e0b' },
      
      { id: 'awning2', type: 'mapSprite', spriteName: 'storefront_awning', x: 400, y: 80, width: 100, height: 30 },
      { id: 'butchers', type: 'mapBuilding', x: 400, y: 110, width: 100, height: 70, label: 'Butchers', iconName: 'Store', fill: '#ef4444' },

      { id: 'pharmacy', type: 'mapBuilding', x: 100, y: 320, width: 100, height: 80, label: 'Pharmacy', iconName: 'Hospital', fill: '#10b981' },
      { id: 'supermarket', type: 'mapBuilding', x: 400, y: 320, width: 160, height: 100, label: 'Supermarket', iconName: 'Store', fill: '#3b82f6' },
      
      { id: 'start_marker', type: 'mapMarker', x: 100, y: 550, radius: 25, color: '#f59e0b', label: 'Start Here!', iconName: 'Flag' }
    ]
  },
  {
    id: 'river_crossing',
    name: 'River Crossing Map',
    shapes: [
      { id: 'bg', type: 'rectangle', x: 400, y: 300, width: 800, height: 600, fill: '#bbf7d0', strokeWidth: 0 },
      { id: 'river_main', type: 'river', x: 400, y: 300, length: 700, width: 250, rotation: 90, color: '#3b82f6' },
      { id: 'golden_gate', type: 'bridge', x: 400, y: 300, length: 300, width: 60, fill: '#334155', bridgeType: 'suspension', label: 'Grand River Bridge', labelColor: '#1e293b' },
      { id: 'road_west', type: 'road', x: 125, y: 300, width: 250, height: 60, fill: '#334155', lineColor: '#fbbf24' },
      { id: 'road_east', type: 'road', x: 675, y: 300, width: 250, height: 60, fill: '#334155', lineColor: '#fbbf24' },
      { id: 'park', type: 'mapSprite', spriteName: 'swings', x: 150, y: 150, width: 64, height: 64 },
      { id: 'tree1', type: 'tree', x: 100, y: 100, trunkWidth: 15, trunkHeight: 30, canopyRadius: 40 },
      { id: 'tree2', type: 'tree', x: 650, y: 450, trunkWidth: 15, trunkHeight: 30, canopyRadius: 35 },
      { id: 'ferry', type: 'mapSprite', spriteName: 'pirate_ship', x: 400, y: 150, width: 50, height: 50 }
    ]
  },
  {
    id: 'highway_interchange',
    name: 'Highway Interchange',
    shapes: [
      { id: 'bg2', type: 'rectangle', x: 400, y: 300, width: 800, height: 600, fill: '#e2e8f0', strokeWidth: 0 },
      
      { id: 'junc_center', type: 'roadJunction', x: 500, y: 300, size: 150, junctionType: 'roundabout', fill: '#334155' },
      { id: 'junc_w', type: 'roadJunction', x: 200, y: 300, size: 150, junctionType: 'cross', fill: '#334155' },
      
      { id: 'road_w_mid', type: 'road', x: 350, y: 300, width: 150, height: 60, fill: '#334155', lineColor: '#fbbf24' },
      { id: 'road_w_outer', type: 'road', x: 62.5, y: 300, width: 125, height: 60, fill: '#334155', lineColor: '#fbbf24' },
      { id: 'road_e', type: 'road', x: 687.5, y: 300, width: 225, height: 60, fill: '#334155', lineColor: '#fbbf24' },
      
      { id: 'road_n', type: 'road', x: 500, y: 112.5, width: 60, height: 225, fill: '#334155', lineColor: '#fbbf24' },
      { id: 'road_s', type: 'road', x: 500, y: 487.5, width: 60, height: 225, fill: '#334155', lineColor: '#fbbf24' },
      
      { id: 'road_w_n', type: 'road', x: 200, y: 112.5, width: 60, height: 225, fill: '#334155', lineColor: '#fbbf24' },
      { id: 'road_w_s', type: 'road', x: 200, y: 487.5, width: 60, height: 225, fill: '#334155', lineColor: '#fbbf24' },
      
      { id: 'gas_station', type: 'mapBuilding', x: 280, y: 150, width: 100, height: 80, label: 'Gas Station', iconName: 'Store', fill: '#ef4444' },
      { id: 'diner', type: 'mapBuilding', x: 650, y: 420, width: 120, height: 80, label: 'Diner', iconName: 'Store', fill: '#3b82f6' }
    ]
  }
];
