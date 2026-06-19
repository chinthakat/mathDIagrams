import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Play, Key } from 'lucide-react';

export default function AIMapGeneratorModal({ isOpen, onClose, onGenerate }) {
  const [gradeLevel, setGradeLevel] = useState('Grade 3');
  const [themePrompt, setThemePrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [useDemo, setUseDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('deepseekApiKey');
    if (savedKey) {
      setApiKey(savedKey);
      setUseDemo(false); // Default to live if key is saved
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Static high-fidelity pre-baked sandbox maps database
  const sandboxMaps = {
    'Grade 2': {
      question: "Emma starts at the Sandbox (B3). She walks 2 blocks North to the Slide, and then 1 block East to the Swings. What coordinate is she at now, and how many blocks did she travel in total?",
      answer: "Coordinate C1, and she traveled 3 blocks total.",
      theme: "grassland",
      shapes: [
        {
          type: 'gridMap',
          x: 400,
          y: 260,
          width: 420,
          height: 420,
          rows: 4,
          cols: 4,
          showCompass: true,
          scaleText: "1 square = 1 block",
          stroke: "#94a3b8",
          landmarks: [
            { id: 'lm1', row: 3, col: 2, label: 'Sandbox (B3)', icon: 'MapPin', color: '#3b82f6' },
            { id: 'lm2', row: 1, col: 2, label: 'Slide (B1)', icon: 'Flag', color: '#eab308' },
            { id: 'lm3', row: 1, col: 3, label: 'Swings (C1)', icon: 'Flag', color: '#ef4444' }
          ],
          routes: [
            { id: 'rt1', path: 'B3-B1-C1', color: '#ef4444' }
          ]
        }
      ]
    },
    'Grade 3': {
      question: "Start at the School (A3). Walk 3 squares East to D3, and then 2 squares North to reach the Library. If each square on the map represents 100 meters, what is the library's coordinate and what is the total distance you walked?",
      answer: "Coordinate D1, total distance of 500 meters (300m East + 200m North).",
      theme: "paper",
      shapes: [
        {
          type: 'gridMap',
          x: 400,
          y: 260,
          width: 420,
          height: 420,
          rows: 4,
          cols: 4,
          showCompass: true,
          scaleText: "1 square = 100m",
          stroke: "#94a3b8",
          landmarks: [
            { id: 'lm1', row: 3, col: 1, label: 'School (A3)', icon: 'School', color: '#3b82f6' },
            { id: 'lm2', row: 1, col: 4, label: 'Library (D1)', icon: 'Library', color: '#10b981' }
          ],
          routes: [
            { id: 'rt1', path: 'A3-D3-D1', color: '#f59e0b' }
          ]
        }
      ]
    },
    'Grade 4': {
      question: "Pirate Jack landed at the Harbor Port. He walked East across the Bridge over the River, and then headed South to the Mountain peaks. In what compass direction must he travel from the Mountains to return directly to his ship at the Port?",
      answer: "North-West (NW)",
      theme: "parchment",
      shapes: [
        { type: 'port', x: 200, y: 200, width: 90, height: 60, color: '#38bdf8', stroke: '#0284c7', label: 'Harbor Port' },
        { type: 'bridge', x: 350, y: 200, length: 120, width: 24, color: '#f59e0b', stroke: '#b45309', rotation: 0 },
        { type: 'river', x: 350, y: 300, length: 400, width: 30, color: '#38bdf8', rotation: 90 },
        { type: 'mountain', x: 550, y: 400, width: 90, height: 70, color: '#64748b', stroke: '#334155' },
        { type: 'flag', x: 550, y: 345, radius: 18, color: '#ef4444', label: 'Treasure Chest', showLabel: true },
        { type: 'compassRose', x: 650, y: 100, radius: 45 },
        { type: 'scaleBar', x: 400, y: 480, width: 150, unitText: '200m' }
      ]
    },
    'Grade 5': {
      question: "A search helicopter takes off from the Airport runway heading East. If it flies for 4 kilometers (Scale: 1 bar = 1km) and then makes a 90 degree turn to the left (North) flying for 2 kilometers, which harbor port does it fly directly over?",
      answer: "East Port (located 4km East and 2km North of the Airport)",
      theme: "ocean",
      shapes: [
        { type: 'airport', x: 200, y: 350, width: 120, height: 70, color: '#475569', label: 'Airport' },
        { type: 'port', x: 600, y: 150, width: 90, height: 60, color: '#38bdf8', label: 'East Port' },
        { type: 'sea', x: 600, y: 250, width: 200, height: 150, color: '#0284c7' },
        { type: 'compassRose', x: 680, y: 80, radius: 45 },
        { type: 'scaleBar', x: 400, y: 480, width: 100, unitText: '1 km' }
      ]
    },
    'Grade 6': {
      question: "From the Lighthouse (Port at x:200, y:150), a ship travels on a bearing of 090° (East) for 400 meters, then turns on a bearing of 180° (South) and travels 300 meters to reach the Sun Temple. What is the straight line distance back to the Lighthouse?",
      answer: "500 meters (using Pythagoras theorem: 300^2 + 400^2 = 500^2)",
      theme: "topography",
      shapes: [
        { type: 'port', x: 200, y: 150, width: 90, height: 60, color: '#38bdf8', label: 'Lighthouse' },
        { type: 'sunDirection', x: 600, y: 450, radius: 35, color: '#eab308', label: 'Sun Temple' },
        { type: 'footpath', x: 400, y: 150, length: 400, width: 8, color: '#e2e8f0', rotation: 0 },
        { type: 'footpath', x: 600, y: 300, length: 300, width: 8, color: '#e2e8f0', rotation: 90 },
        { type: 'compassRose', x: 680, y: 80, radius: 45 },
        { type: 'scaleBar', x: 400, y: 500, width: 100, unitText: '100m' }
      ]
    }
  };

  const assignUniqueIds = (data) => {
    return {
      ...data,
      shapes: (data.shapes || []).map(s => {
        const shapeId = `${s.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        if (s.type === 'gridMap') {
          return {
            ...s,
            id: shapeId,
            landmarks: (s.landmarks || []).map((lm, idx) => ({
              ...lm,
              id: lm.id || `lm-${idx}-${Date.now()}-${Math.floor(Math.random() * 100)}`
            })),
            routes: (s.routes || []).map((rt, idx) => ({
              ...rt,
              id: rt.id || `rt-${idx}-${Date.now()}-${Math.floor(Math.random() * 100)}`
            }))
          };
        }
        return { ...s, id: shapeId };
      })
    };
  };

  const handleGenerate = async () => {
    // 1. Sandbox / Mock generation
    if (useDemo) {
      setLoading(true);
      setTimeout(() => {
        const mockData = sandboxMaps[gradeLevel] || sandboxMaps['Grade 3'];
        const result = assignUniqueIds(mockData);
        onGenerate(result);
        setLoading(false);
        onClose();
      }, 1000);
      return;
    }

    // 2. Live DeepSeek API generation
    if (!apiKey) {
      setError('Please provide a DeepSeek API key, or select Sandbox Demo Mode.');
      return;
    }

    // Save key to localStorage
    localStorage.setItem('deepseekApiKey', apiKey);
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are an AI mathematical map diagram generator. Return ONLY a valid JSON object. Do not wrap the JSON output in markdown \`\`\`json code blocks.
The JSON must match the following schema:
{
  "question": "A clear, mathematically rich navigation, direction, or bearing math question suitable for ${gradeLevel} with the requested theme/topic.",
  "answer": "The numerical or short text answer with a brief description of the steps.",
  "theme": "one of: paper, parchment, blueprint, topography, grassland, desert, ocean, dark",
  "shapes": [
    ...shapes to render...
  ]
}

Layout Paradigm Rules:
Depending on the type of question, you MUST choose between two distinct layout modes:

Mode A: COORDINATE GRID MAP
Use this mode if the question refers to a coordinate grid system with column letters (A, B, C, D) and row numbers (1, 2, 3, 4).
- The 'shapes' array must contain exactly ONE shape of type 'gridMap'. No other shapes (like roads, trees, markers, or buildings) are allowed in the shapes array.
- The 'gridMap' properties MUST be:
  {
    "type": "gridMap",
    "x": 400,
    "y": 260,
    "width": 420,
    "height": 420,
    "rows": 4,
    "cols": 4,
    "showCompass": true,
    "scaleText": "1 square = 1 block",
    "stroke": "#94a3b8",
    "landmarks": [
      {
        "id": "school",
        "col": 2, // 'B' maps to column 2
        "row": 3, // Row index 3 maps to row label '3'
        "label": "School (B3)",
        "icon": "School",
        "color": "#ef4444"
      },
      ...
    ],
    "routes": [
      {
        "id": "route1",
        "path": "B3-B1-C1", // Path sequence showing the steps taken
        "color": "#f59e0b"
      }
    ]
  }
- Important grid calculations:
  - Column A = 1, B = 2, C = 3, D = 4.
  - Row 1 is at the TOP (North), row 4 is at the BOTTOM (South). Moving North decreases the row index, moving South increases it.
  - Route paths must match the question exactly. Example: "Start at B3. Walk 2 blocks North (row decreases by 2 to B1) then 1 block East (column increases by 1 to C1)". Path is "B3-B1-C1".
  - Landmark labels should indicate the coordinate in parenthesis like "Library (C1)".

Mode B: FREEFORM LANDSCAPE MAP
Use this mode if the question is based on distances (in meters/kilometers), compass directions (N, S, E, W, NE, SW) or degrees, without grid references.
- The 'shapes' array must contain individual elements (like mapBuilding, road, river, bridge, tree, mountain, compassRose, scaleBar).
- You MUST follow strict layout and alignment guidelines to avoid overlaps and misalignments:
  1. Always include a 'compassRose' (suggested x: 650, y: 100, radius: 45) and a 'scaleBar' (suggested x: 400, y: 480, width: 150, unitText: e.g. '100m').
  2. Roads and Rivers must be linear or perpendicular, not randomly angled unless forming a logical intersection.
     - A horizontal road: e.g., { "type": "road", "x": 400, "y": 300, "width": 400, "height": 32, "fill": "#475569", "lineColor": "#fbbf24", "rotation": 0 }
     - A vertical road: e.g., { "type": "road", "x": 300, "y": 250, "width": 32, "height": 300, "fill": "#475569", "lineColor": "#fbbf24", "rotation": 90 }
  3. Bridges must align perfectly with Rivers:
     - If a vertical river is at x: 350, y: 300 (rotation: 90, length: 400), a horizontal bridge crossing it must be at x: 350, y: 300 (rotation: 0, length: 120, width: 24).
  4. Buildings ('mapBuilding') and Markers ('mapMarker') should be placed at clean coordinates, separated by at least 100px so they don't overlap, and labelled clearly.
  5. Trees and Mountain peaks should be placed as decorative clusters or key points in the question.

Mathematical Graded Complexity Expectations:
- Grade 2: Simple directions (N, S, E, W), simple paths.
- Grade 3: Summing straight line path lengths (e.g. "Walk 200m East, then 150m North. Total distance?").
- Grade 4: Compass directions, simple navigation logic, relative positions (e.g., "Which building is North-East of the School?").
- Grade 5: Scale bar conversions, grid maps with fractional scales, complex routes.
- Grade 6: Pythagoras diagonal calculations (e.g., right-angled triangle paths: 300m East, 400m North, distance back to start is 500m) or bearings in degrees (e.g. 090 degrees for East, 180 for South).

Available Shape Types and Their Exact Properties:
1. gridMap: { type: 'gridMap', x, y, width, height, rows, cols, showCompass, scaleText, landmarks: [{ id, row, col, label, icon, color }], routes: [{ id, path, color }], stroke }
   - Icons for landmarks: School, Library, Home, Building, Hospital, Store, MapPin, Flag.
2. mapBuilding: { type: 'mapBuilding', x, y, width, height, fill, stroke, label, iconName, showLabel }
   - iconName: School, Library, Home, Building, Hospital, Store.
3. mapMarker: { type: 'mapMarker', x, y, radius, color, label, iconName, showLabel }
   - iconName: MapPin, Flag, Compass, Sun.
4. road: { type: 'road', x, y, width, height, fill, lineColor, rotation }
5. tree: { type: 'tree', x, y, trunkWidth, trunkHeight, canopyRadius, trunkColor, canopyColor }
6. river: { type: 'river', x, y, length, width, color, rotation }
7. lake: { type: 'lake', x, y, radius, color, stroke, strokeWidth }
8. sea: { type: 'sea', x, y, width, height, color, stroke }
9. mountain: { type: 'mountain', x, y, width, height, color, stroke }
10. bridge: { type: 'bridge', x, y, length, width, color, stroke, rotation }
11. footpath: { type: 'footpath', x, y, length, width, color, rotation }
12. playground: { type: 'playground', x, y, width, height, color, stroke }
13. airport: { type: 'airport', x, y, width, height, color, stroke }
14. port: { type: 'port', x, y, width, height, color, stroke }
15. sunDirection: { type: 'sunDirection', x, y, radius, color, label }
16. flag: { type: 'flag', x, y, radius, color, label, showLabel }
17. compassRose: { type: 'compassRose', x, y, radius, color, fill }
18. scaleBar: { type: 'scaleBar', x, y, width, height, color, unitText }`
            },
            {
              role: 'user',
              content: `Generate a high quality map math question with the theme/topic: "${themePrompt || 'Town navigation'}" for ${gradeLevel}.`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText} (${response.status})`);
      }

      const rawData = await response.json();
      let cleanContent = rawData.choices[0].message.content.trim();
      
      // Clean potential LLM markdown tags
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```json/, '').replace(/```$/, '').trim();
      }

      const result = JSON.parse(cleanContent);
      if (!result.question || !result.shapes) {
        throw new Error("Response JSON did not contain 'question' or 'shapes' array.");
      }

      const mappedResult = assignUniqueIds(result);

      onGenerate(mappedResult);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to call DeepSeek API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: '480px', animation: 'slideUp 0.3s ease-out' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
            <Sparkles size={20} /> AI Map & Question Generator
          </h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Input: Grade Level */}
          <div className="input-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>Grade Level</label>
            <select
              value={gradeLevel}
              onChange={e => setGradeLevel(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', marginTop: '4px', outline: 'none' }}
            >
              <option value="Grade 2">Grade 2 (Simple Directions)</option>
              <option value="Grade 3">Grade 3 (Directions & Distances)</option>
              <option value="Grade 4">Grade 4 (Compass Bearings & W/E/N/S)</option>
              <option value="Grade 5">Grade 5 (Grid Scales & Complex Path Maths)</option>
              <option value="Grade 6">Grade 6 (Pythagoras & Bearings in Degrees)</option>
            </select>
          </div>

          {/* Input: Topic prompt hint */}
          <div className="input-group">
            <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>Theme / Topic Hint (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Treasure Island, Zoo Navigation, Space Grid"
              value={themePrompt}
              onChange={e => setThemePrompt(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', marginTop: '4px', outline: 'none' }}
            />
          </div>

          {/* Option: Sandbox Demo vs Live */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'white', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={useDemo}
                onChange={e => setUseDemo(e.target.checked)}
                disabled={loading}
                style={{ accentColor: '#10b981' }}
              />
              Use Demo Sandbox Mode (Free, Instant)
            </label>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '20px' }}>
              Renders pre-baked high-quality assessment maps without calling DeepSeek API.
            </p>
          </div>

          {/* DeepSeek API Key input */}
          {!useDemo && (
            <div className="input-group" style={{ animation: 'fadeIn 0.2s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                <Key size={14} /> DeepSeek API Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                disabled={loading}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', marginTop: '4px', outline: 'none' }}
              />
            </div>
          )}

          {/* Action button */}
          <button
            className="btn"
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              border: 'none',
              fontWeight: '600',
              marginTop: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <span>Generating Map...</span>
            ) : (
              <>
                <Sparkles size={16} /> Generate AI Map & Question
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
