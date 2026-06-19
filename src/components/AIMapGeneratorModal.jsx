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
      question: "Emma is standing at the Sandbox (B2). If she walks 2 squares North to the Slide, and then 1 square East to the Swings, what grid coordinate is she at?",
      answer: "C4 (or Swings at C4)",
      theme: "grassland",
      shapes: [
        { id: 'sb-1', type: 'playground', x: 250, y: 300, width: 80, height: 80, color: '#10b981', label: 'Playground Base' },
        { id: 'sb-2', type: 'mapMarker', x: 250, y: 300, radius: 20, color: '#3b82f6', label: 'Sandbox (B2)', iconName: 'MapPin' },
        { id: 'sb-3', type: 'mapMarker', x: 250, y: 150, radius: 20, color: '#eab308', label: 'Slide (B4)', iconName: 'Flag' },
        { id: 'sb-4', type: 'flag', x: 350, y: 150, radius: 20, color: '#ef4444', label: 'Swings (C4)', showLabel: true },
        { id: 'sb-5', type: 'tree', x: 150, y: 150, canopyColor: '#15803d', trunkColor: '#78350f', canopyRadius: 18 },
        { id: 'sb-6', type: 'tree', x: 450, y: 300, canopyColor: '#16a34a', trunkColor: '#78350f', canopyRadius: 22 },
        { id: 'sb-7', type: 'compassRose', x: 650, y: 100, radius: 45 },
        { id: 'sb-8', type: 'scaleBar', x: 400, y: 480, width: 120, unitText: '50m' }
      ]
    },
    'Grade 3': {
      question: "Start at the School (A2). Walk 300 meters East along High Street, and then turn North. Walk 200 meters to reach the Library. How many total meters did you walk?",
      answer: "500 meters",
      theme: "paper",
      shapes: [
        { id: 't-1', type: 'mapBuilding', x: 180, y: 320, width: 70, height: 50, fill: '#3b82f6', stroke: '#1d4ed8', label: 'School (A2)', iconName: 'School' },
        { id: 't-2', type: 'road', x: 340, y: 320, width: 250, height: 32, fill: '#475569', lineColor: '#fbbf24', rotation: 0 },
        { id: 't-3', type: 'mapBuilding', x: 500, y: 160, width: 70, height: 50, fill: '#10b981', stroke: '#047857', label: 'Library (D4)', iconName: 'Building' },
        { id: 't-4', type: 'road', x: 500, y: 240, width: 32, height: 130, fill: '#475569', lineColor: '#fbbf24', rotation: 90 },
        { id: 't-5', type: 'tree', x: 320, y: 220, canopyColor: '#16a34a', canopyRadius: 20 },
        { id: 't-6', type: 'tree', x: 360, y: 240, canopyColor: '#15803d', canopyRadius: 16 },
        { id: 't-7', type: 'compassRose', x: 650, y: 100, radius: 45 },
        { id: 't-8', type: 'scaleBar', x: 400, y: 480, width: 150, unitText: '100m' }
      ]
    },
    'Grade 4': {
      question: "Pirate Jack landed at the Harbor Port (B1). He walked East across the Bridge over the River, and then headed South to the Mountain peaks. In what direction must he travel to return to his ship at the Port?",
      answer: "North-West (NW)",
      theme: "parchment",
      shapes: [
        { id: 'p-1', type: 'port', x: 180, y: 180, width: 100, height: 70, color: '#38bdf8', stroke: '#0284c7', label: 'Port (B1)' },
        { id: 'p-2', type: 'bridge', x: 340, y: 180, length: 110, width: 24, color: '#f59e0b', stroke: '#b45309', rotation: 0 },
        { id: 'p-3', type: 'river', x: 340, y: 320, length: 300, width: 24, color: '#38bdf8', rotation: 90 },
        { id: 'p-4', type: 'mountain', x: 520, y: 380, width: 90, height: 70, color: '#64748b', stroke: '#334155' },
        { id: 'p-5', type: 'flag', x: 520, y: 340, radius: 18, color: '#ef4444', label: 'Treasure Base' },
        { id: 'p-6', type: 'compassRose', x: 660, y: 110, radius: 50 },
        { id: 'p-7', type: 'scaleBar', x: 400, y: 480, width: 150, unitText: '200m' }
      ]
    },
    'Grade 5': {
      question: "A search plane takes off from the Airport runway heading East. If it flies for 4 kilometers (Scale: 1 bar = 1km) and then makes a 90 degree turn to the left (North), which harbor port does it fly directly over?",
      answer: "The Harbor Port (D4)",
      theme: "ocean",
      shapes: [
        { id: 'a-1', type: 'airport', x: 200, y: 380, width: 130, height: 80, color: '#475569', label: 'Airport (B2)' },
        { id: 'a-2', type: 'port', x: 600, y: 150, width: 100, height: 70, color: '#38bdf8', label: 'Harbor (D4)' },
        { id: 'a-3', type: 'sea', x: 600, y: 250, width: 180, height: 120, color: '#0284c7' },
        { id: 'a-4', type: 'compassRose', x: 680, y: 80, radius: 45 },
        { id: 'a-5', type: 'scaleBar', x: 400, y: 480, width: 160, unitText: '1 km' }
      ]
    },
    'Grade 6': {
      question: "From the Lighthouse (Port at B2), a ship travels on a bearing of 090° (East) for 400 meters, then turns on a bearing of 180° (South) and travels 300 meters to reach the Sun Temple. What is the straight-line distance back to the Lighthouse?",
      answer: "500 meters (using Pythagoras theorem: 300^2 + 400^2 = 500^2)",
      theme: "topography",
      shapes: [
        { id: 'g6-1', type: 'port', x: 200, y: 180, width: 90, height: 60, color: '#38bdf8', label: 'Lighthouse (B2)' },
        { id: 'g6-2', type: 'sunDirection', x: 600, y: 480, radius: 35, color: '#eab308', label: 'Sun Temple (F6)' },
        { id: 'g6-3', type: 'footpath', x: 400, y: 180, length: 390, width: 8, color: '#e2e8f0', rotation: 0 },
        { id: 'g6-4', type: 'footpath', x: 600, y: 330, length: 290, width: 8, color: '#e2e8f0', rotation: 90 },
        { id: 'g6-5', type: 'compassRose', x: 680, y: 90, radius: 45 },
        { id: 'g6-6', type: 'scaleBar', x: 400, y: 500, width: 120, unitText: '100m' }
      ]
    }
  };

  const handleGenerate = async () => {
    // 1. Sandbox / Mock generation
    if (useDemo) {
      setLoading(true);
      setTimeout(() => {
        const mockData = sandboxMaps[gradeLevel] || sandboxMaps['Grade 3'];
        // Generate new random IDs to prevent duplication conflicts on subsequent triggers
        const result = {
          ...mockData,
          shapes: mockData.shapes.map(s => ({
            ...s,
            id: `${s.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          }))
        };
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
              content: `You are an AI mathematical map diagram generator. Return ONLY a valid JSON object. Do not wrap the JSON output in markdown \`\`\`json code blocks. The JSON must match the following schema:
{
  "question": "A clear, descriptive direction, bearing, or navigation math question suitable for ${gradeLevel} (e.g. 'Start at the school (B2). Go 2 blocks East and 1 block North...').",
  "answer": "The numerical or short text answer.",
  "theme": "one of: paper, parchment, blueprint, topography, grassland, desert, ocean, dark",
  "shapes": [
    {
      "type": "mapMarker",
      "x": 200,
      "y": 150,
      "color": "#ef4444",
      "label": "Start",
      "iconName": "MapPin"
    }
  ]
}
Important:
1. Available shape types: mapMarker, mapBuilding, road, tree, river, lake, sea, mountain, bridge, footpath, playground, airport, port, sunDirection, flag, compassRose, scaleBar.
2. Coordinates (x, y) should sit between X: 100 to 700 and Y: 100 to 500.
3. Colors must be hex codes.
4. Default properties for shapes:
   - mapMarker: { radius, color, label, iconName } (iconName from MapPin, Flag, Compass, Sun)
   - mapBuilding: { fill, stroke, width, height, label, iconName }
   - road: { width, height, fill, lineColor, rotation }
   - tree: { trunkWidth, trunkHeight, canopyRadius, trunkColor, canopyColor }
   - river: { length, width, color, strokeWidth }
   - lake: { radius, color, stroke, strokeWidth }
   - sea: { width, height, color, stroke }
   - mountain: { width, height, color, stroke }
   - bridge: { length, width, color, stroke }
   - footpath: { length, width, color }
   - playground: { width, height, color, stroke }
   - airport: { width, height, color, stroke }
   - port: { width, height, color, stroke }
   - sunDirection: { radius, color, label }
   - flag: { radius, color, label, showLabel }
   - compassRose: { radius, color, fill }
   - scaleBar: { width, height, color, unitText }`
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

      // Format custom shapes with IDs
      const mappedResult = {
        ...result,
        shapes: result.shapes.map(s => ({
          ...s,
          id: `${s.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        }))
      };

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
