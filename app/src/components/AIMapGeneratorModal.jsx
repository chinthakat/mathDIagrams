import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Play, Key, Terminal, Clipboard, Check } from 'lucide-react';

import { getApiKey } from '../services/claudeService';

export default function AIMapGeneratorModal({ isOpen, onClose, onGenerate, onQuestionGenerated }) {
  const [gradeLevel, setGradeLevel] = useState('Grade 3');
  const [mapCategory, setMapCategory] = useState('Grid Reference Map');
  const [themePrompt, setThemePrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [useDemo, setUseDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDebug, setShowDebug] = useState(true);
  const [saveKey, setSaveKey] = useState(true);
  const [debugRequest, setDebugRequest] = useState(null);
  const [debugResponse, setDebugResponse] = useState(null);

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
      const mockData = sandboxMaps[gradeLevel] || sandboxMaps['Grade 3'];
      
      setDebugRequest({
        url: "DEMO_SANDBOX_MODE (Bypassed API call)",
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        body: {
          mode: "sandbox",
          gradeLevel: gradeLevel,
          themeHint: themePrompt || "None",
          selectedPreBakedMap: `Pre-baked template for ${gradeLevel}`
        }
      });

      setTimeout(() => {
        const result = assignUniqueIds(mockData);
        setDebugResponse({
          status: 200,
          statusText: "OK",
          data: result
        });
        onGenerate(result);
        if (result.question && onQuestionGenerated) {
          onQuestionGenerated({
            stem: result.question,
            options: [
              { text: result.answer, correct: true },
              { text: 'See map for details', correct: false },
              { text: 'Not enough information', correct: false },
              { text: 'None of the above', correct: false },
            ],
          });
        }
        setLoading(false);
        if (!showDebug) {
          onClose();
        }
      }, 1000);
      return;
    }

    // 2. Live DeepSeek API generation
    if (!apiKey) {
      setError('Please provide a DeepSeek API key, or select Sandbox Demo Mode.');
      return;
    }

    // Save key to localStorage if requested
    if (saveKey) {
      localStorage.setItem('deepseekApiKey', apiKey);
    } else {
      localStorage.removeItem('deepseekApiKey');
    }
    
    setLoading(true);
    setError('');

    let categoryRules = '';
    if (mapCategory === 'Grid Reference Map') {
      categoryRules = `Mode A: COORDINATE GRID MAP
Use this mode. The 'shapes' array must contain exactly ONE shape of type 'gridMap'. No other shapes (like roads, trees, markers, or buildings) are allowed in the shapes array.
- The 'gridMap' properties MUST be:
  {
    "type": "gridMap",
    "x": 400, "y": 260, "width": 420, "height": 420, "rows": 4, "cols": 4, "showCompass": true, "scaleText": "1 square = 1 block", "stroke": "#94a3b8",
    "landmarks": [ { "id": "school", "col": 2, "row": 3, "label": "School (B3)", "icon": "School", "color": "#ef4444" } ],
    "routes": [ { "id": "route1", "path": "B3-B1-C1", "color": "#f59e0b" } ]
  }
- Important grid calculations: Column A = 1, B = 2, C = 3, D = 4. Row 1 is at the TOP (North), row 4 is at the BOTTOM (South).
- Generate questions like: "What object is found at [Coordinate]?" or "What is the grid reference for the [Object]?".`;
    } else if (mapCategory === 'Community Layout Map') {
      categoryRules = `Mode B: FREEFORM LANDSCAPE MAP - Community Layout
- The 'shapes' array must contain individual elements (like mapBuilding, road, tree).
- Describe a town layout with at least 4 named intersecting streets and 8 distinct landmarks (e.g., Fire Station, Library, Bakery, Park).
- Explicitly state the spatial relationships in the question (e.g., "The Bakery is on the corner of Elm St and Oak St, next to the Library").
- Ask spatial relationship questions (e.g., "What building is directly north of the Fire Station?", or "Which street do you cross to get from the Park to the Bakery?").`;
    } else if (mapCategory === 'Directional Navigation Map') {
      categoryRules = `Mode B: FREEFORM LANDSCAPE MAP - Directional Navigation
- The 'shapes' array must contain individual elements (like mapBuilding, road, tree).
- Include a specific starting point. Describe a path with at least 3 intersections. Place 5-6 different shops or buildings along these streets.
- Generate questions like: "You are at START. Go straight ahead. Take the first left, then the second right. What building is on your left?" or "Write the step-by-step directions to get from the START to the [Building]."`;
    }

    const systemPromptContent = `You are an AI mathematical map diagram generator. Return ONLY a valid JSON object. Do not wrap the JSON output in markdown \`\`\`json code blocks.
The JSON must match the following schema:
{
  "question": "A clear navigation or spatial question suitable for ${gradeLevel} matching the ${mapCategory}.",
  "answer": "The numerical or short text answer with a brief description of the steps.",
  "theme": "one of: paper, parchment, blueprint, topography, grassland, desert, ocean, dark",
  "shapes": [
    ...shapes to render...
  ]
}

Layout Paradigm Rules:
${categoryRules}

CRITICAL SHAPES REQUIREMENT:
- The 'shapes' array must NEVER be empty. For every single location, landmark, route, and distance path mentioned in the question text, you MUST generate matching canvas shapes with correct positions so the map matches the question.
- Always include a 'compassRose' and a 'scaleBar' for Mode B.
- Buildings and markers must not overlap and be cleanly labeled.

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
18. scaleBar: { type: 'scaleBar', x, y, width, height, color, unitText }`;

    const userPromptContent = `Generate a high quality map math question with the theme/topic: "${themePrompt || 'Town navigation'}" for ${gradeLevel}.`;

    try {
      const requestPayload = {
        model: 'deepseek-v4-pro',
        messages: [
          { role: 'system', content: systemPromptContent },
          { role: 'user', content: userPromptContent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      };

      setDebugRequest({
        url: 'https://api.deepseek.com/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.slice(0, 8)}...[HIDDEN]`
        },
        body: requestPayload
      });

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        setDebugResponse({
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`API error: ${response.statusText} (${response.status})`);
      }

      const rawData = await response.json();
      setDebugResponse({
        status: response.status,
        statusText: response.statusText,
        data: rawData
      });

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
      if (!showDebug) {
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to call DeepSeek API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content" 
        style={{ 
          width: showDebug ? '960px' : '480px', 
          maxWidth: '95vw',
          maxHeight: '90vh',
          transition: 'width 0.3s ease-in-out',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
            <Sparkles size={20} /> AI Map & Question Generator
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setShowDebug(!showDebug)}
              style={{
                background: 'transparent',
                border: '1px solid ' + (showDebug ? '#10b981' : 'var(--border-color)'),
                color: showDebug ? '#10b981' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Terminal size={12} /> {showDebug ? "Hide Debug Console" : "Show Debug Console"}
            </button>
            <button className="close-btn" onClick={onClose} disabled={loading}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Column: Form Controls */}
          <div 
            className="modal-body" 
            style={{ 
              width: showDebug ? '50%' : '100%', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              overflowY: 'auto' 
            }}
          >
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

            {/* Input: Map Category */}
            <div className="input-group">
              <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>Map Category</label>
              <select
                value={mapCategory}
                onChange={e => setMapCategory(e.target.value)}
                disabled={loading}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '6px', marginTop: '4px', outline: 'none' }}
              >
                <option value="Grid Reference Map">Grid Reference Map</option>
                <option value="Community Layout Map">Community Layout Map</option>
                <option value="Directional Navigation Map">Directional Navigation Map</option>
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
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="checkbox" 
                    id="saveKeyCheckbox" 
                    checked={saveKey} 
                    onChange={e => setSaveKey(e.target.checked)} 
                    disabled={loading} 
                    style={{ accentColor: '#10b981' }} 
                  />
                  <label htmlFor="saveKeyCheckbox" style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                    Save API key for future use
                  </label>
                </div>
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

          {/* Right Column: AI Request/Response Debug Panel */}
          {showDebug && (
            <div 
              style={{ 
                width: '50%', 
                display: 'flex', 
                flexDirection: 'column', 
                borderLeft: '1px solid var(--border-color)', 
                background: 'rgba(0,0,0,0.15)',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-dark)' }}>
                <div style={{ padding: '8px 16px', fontSize: '12px', color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={14} /> AI Request/Response Logs
                </div>
              </div>

              <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                {/* 1. Sent Prompt Request */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Sent Request Details:</span>
                    {debugRequest && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(debugRequest, null, 2));
                          alert("Copied Request Payload!");
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Clipboard size={12} /> Copy Request
                      </button>
                    )}
                  </div>
                  <pre 
                    style={{ 
                      margin: 0, 
                      padding: '10px', 
                      background: '#090d16', 
                      border: '1px solid #1e293b', 
                      color: '#a5b4fc', 
                      borderRadius: '6px', 
                      fontFamily: 'monospace', 
                      fontSize: '11px', 
                      maxHeight: '180px', 
                      overflow: 'auto', 
                      whiteSpace: 'pre-wrap' 
                    }}
                  >
                    {debugRequest ? JSON.stringify(debugRequest, null, 2) : "No request logged yet. Click 'Generate' to see logs."}
                  </pre>
                </div>

                {/* 2. Received Response */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Received Response Details:</span>
                    {debugResponse && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(debugResponse, null, 2));
                          alert("Copied Response Payload!");
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Clipboard size={12} /> Copy Response
                      </button>
                    )}
                  </div>
                  <pre 
                    style={{ 
                      margin: 0, 
                      padding: '10px', 
                      background: '#090d16', 
                      border: '1px solid #1e293b', 
                      color: '#38bdf8', 
                      borderRadius: '6px', 
                      fontFamily: 'monospace', 
                      fontSize: '11px', 
                      flex: 1, 
                      maxHeight: '300px',
                      overflow: 'auto', 
                      whiteSpace: 'pre-wrap' 
                    }}
                  >
                    {debugResponse ? JSON.stringify(debugResponse, null, 2) : "No response logged yet."}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
