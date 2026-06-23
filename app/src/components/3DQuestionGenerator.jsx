import React, { useState } from 'react';
import { X, Box, Dice1, Play, Save } from 'lucide-react';
import ShapeNets from './MathObjects3D/ShapeNets';
import ElevationViewer from './ElevationViewer';
import { useEffect } from 'react';

export default function ThreeDQuestionGenerator({ onClose, onSave, initialData }) {
  const [activeTab, setActiveTab] = useState('nets'); // 'nets' or 'elevations'
  const [generatedShapes, setGeneratedShapes] = useState([]);
  const [netOptions, setNetOptions] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [generatedElevations, setGeneratedElevations] = useState([]);
  const [interactiveViewType, setInteractiveViewType] = useState('isometric');

  useEffect(() => {
    if (initialData) {
      if (initialData.category === '3D_NET_QUIZ') {
        setActiveTab('nets');
        setGeneratedShapes([initialData.payload.targetShape]);
        setNetOptions(initialData.payload.options);
      } else if (initialData.category === '3D_ELEVATIONS') {
        setActiveTab('elevations');
        setGeneratedElevations(initialData.payload.blocks);
      }
    }
  }, [initialData]);

  // Generate a random block structure for Elevations
  const handleGenerateElevations = () => {
    const newShapes = [];
    // Always start with a central block at 0,0,0
    newShapes.push({ id: 'block0', type: 'cube', x: 0, y: 0, z: 0, color: '#3b82f6' });
    
    // Add 3-6 random blocks connected to it
    const numBlocks = Math.floor(Math.random() * 4) + 3;
    const positions = new Set(['0,0,0']);
    let lastPos = [0, 0, 0];

    for (let i = 0; i < numBlocks; i++) {
      const directions = [
        [1, 0, 0], [-1, 0, 0], 
        [0, 1, 0], // Only stack up, don't build underground
        [0, 0, 1], [0, 0, -1]
      ];
      
      // Pick a random direction
      const d = directions[Math.floor(Math.random() * directions.length)];
      let newPos = [lastPos[0] + d[0], lastPos[1] + d[1], lastPos[2] + d[2]];
      
      // Ensure we stay above ground
      if (newPos[1] < 0) newPos[1] = 0;

      const posKey = `${newPos[0]},${newPos[1]},${newPos[2]}`;
      if (!positions.has(posKey)) {
        positions.add(posKey);
        newShapes.push({ 
          id: `block${i+1}`, 
          type: 'cube', 
          x: newPos[0], 
          y: newPos[1], 
          z: newPos[2], 
          color: '#3b82f6' 
        });
        lastPos = newPos;
      }
    }
    setGeneratedElevations(newShapes);
  };

  const handleGenerateNets = () => {
    const shapes = ['cube', 'cylinder', 'cone', 'squarePyramid', 'tetrahedron', 'octahedron', 'triangularPrism'];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    setGeneratedShapes([randomShape]);
    
    const options = ['correct', 'incorrect1', 'incorrect2', 'incorrect3'];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    setNetOptions(options);
    setShowAnswer(false);
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ background: '#0f172a', borderRadius: '12px', width: '800px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #1e293b' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
            <Box color="#8b5cf6" /> 3D Geometric Reasoning Generator
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
          <button 
            onClick={() => setActiveTab('nets')}
            style={{ flex: 1, padding: '12px', background: activeTab === 'nets' ? '#1e293b' : 'transparent', border: 'none', color: activeTab === 'nets' ? 'white' : '#94a3b8', cursor: 'pointer', fontWeight: '600' }}
          >
            Shape Nets (Unfolding)
          </button>
          <button 
            onClick={() => setActiveTab('elevations')}
            style={{ flex: 1, padding: '12px', background: activeTab === 'elevations' ? '#1e293b' : 'transparent', border: 'none', color: activeTab === 'elevations' ? 'white' : '#94a3b8', cursor: 'pointer', fontWeight: '600' }}
          >
            Plans & Elevations
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: '#f8fafc' }}>
          
          {activeTab === 'nets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: '#cbd5e1' }}>Generate a random 3D shape and its mathematically accurate 2D net.</p>
                <button className="btn" onClick={handleGenerateNets} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Dice1 size={16} /> Generate Shape
                </button>
              </div>

              {generatedShapes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', background: '#1e293b', padding: '24px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <div style={{ width: '400px', background: 'white', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center', textTransform: 'capitalize' }}>
                        Target 3D Shape
                      </div>
                      <ElevationViewer 
                        shapes={[{ id: 'net3d', type: generatedShapes[0], x: 0, y: 0, z: 0, color: '#3b82f6' }]} 
                        viewType="isometric" 
                        width={350} 
                        height={350} 
                        force3DStyle={true} 
                      />
                    </div>
                  </div>
                  
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', textAlign: 'center' }}>
                    Which of the following 2D nets correctly folds into the target shape above?
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {netOptions.map((variant, index) => (
                      <div key={variant} style={{ background: 'white', borderRadius: '8px', padding: '16px', minHeight: '250px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '16px', left: '16px', background: showAnswer && variant === 'correct' ? '#10b981' : '#3b82f6', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        {showAnswer && variant === 'correct' && (
                          <div style={{ position: 'absolute', top: '16px', right: '16px', color: '#10b981', fontWeight: 'bold', fontSize: '14px', border: '2px solid #10b981', borderRadius: '16px', padding: '4px 8px' }}>
                            Correct Answer
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                          <ShapeNets shapeType={generatedShapes[0]} variant={variant} size={40} strokeWidth={2} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '12px' }}>
                    <button 
                      className="btn" 
                      onClick={() => setShowAnswer(!showAnswer)} 
                      style={{ background: showAnswer ? '#334155' : '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {showAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                    <button 
                      className="btn" 
                      onClick={async () => {
                        try {
                          const correctIndex = netOptions.findIndex(v => v === 'correct');
                          const response = await fetch('/api/generations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: crypto.randomUUID(),
                              createdAt: new Date().toISOString(),
                              title: `${generatedShapes[0].charAt(0).toUpperCase() + generatedShapes[0].slice(1)} Net Quiz`,
                              category: '3D_NET_QUIZ',
                              request: { type: 'random_generation' },
                              payload: {
                                targetShape: generatedShapes[0],
                                targetStyles: { color: '#3b82f6', wireframe: false, edgeColor: '#000000', edgeWidth: 1 },
                                options: netOptions,
                                correctAnswerIndex: correctIndex,
                                correctVariantName: 'correct'
                              }
                            })
                          });
                          if (!response.ok) throw new Error('Network response was not ok');
                          alert('Saved to Library!');
                        } catch (e) {
                          console.error(e);
                          alert('Failed to save.');
                        }
                      }} 
                      style={{ background: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Save size={16} /> Save to Library
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'elevations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: '#cbd5e1' }}>Generate a random 3D building block structure and analyze its elevations.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {generatedElevations.length > 0 && (
                    <button className="btn" onClick={async () => {
                        try {
                          const response = await fetch('/api/generations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: crypto.randomUUID(),
                              createdAt: new Date().toISOString(),
                              title: `Building Blocks Challenge`,
                              category: '3D_ELEVATIONS',
                              request: { type: 'random_generation' },
                              payload: { blocks: generatedElevations }
                            })
                          });
                          if (!response.ok) throw new Error('Network response was not ok');
                          alert('Saved to Library!');
                        } catch (e) {
                          console.error(e);
                          alert('Failed to save.');
                        }
                      }} style={{ background: '#6366f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Save size={16} /> Save to Library
                    </button>
                  )}
                  <button className="btn" onClick={handleGenerateElevations} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Dice1 size={16} /> Generate Blocks
                  </button>
                </div>
              </div>

              {generatedElevations.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>3D Shape</span>
                      <ElevationViewer shapes={generatedElevations} viewType={interactiveViewType} width={300} height={300} force3DStyle={true} />
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', background: '#1e293b', padding: '6px', borderRadius: '8px' }}>
                        <button onClick={() => setInteractiveViewType('isometric')} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: interactiveViewType === 'isometric' ? '#3b82f6' : 'transparent', color: interactiveViewType === 'isometric' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}>Iso</button>
                        <button onClick={() => setInteractiveViewType('front')} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: interactiveViewType === 'front' ? '#3b82f6' : 'transparent', color: interactiveViewType === 'front' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}>Front</button>
                        <button onClick={() => setInteractiveViewType('side')} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: interactiveViewType === 'side' ? '#3b82f6' : 'transparent', color: interactiveViewType === 'side' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}>Side</button>
                        <button onClick={() => setInteractiveViewType('plan')} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: interactiveViewType === 'plan' ? '#3b82f6' : 'transparent', color: interactiveViewType === 'plan' ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer' }}>Top</button>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                    <button 
                      className="btn" 
                      onClick={() => {
                        onSave(generatedElevations);
                        onClose();
                      }}
                      style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Save size={16} /> Save Structure to 3D Canvas
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
