import React, { useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Grid, OrbitControls, Bounds } from '@react-three/drei';
import Shape3D from './MathObjects3D/Shape3D';
import * as THREE from 'three';

function CameraRig({ viewMode }) {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    if (!controls) return;
    
    if (viewMode === 'iso') {
      camera.position.set(5, 5, 5);
    } else if (viewMode === 'front') {
      camera.position.set(0, 0, 15);
    } else if (viewMode === 'side') {
      camera.position.set(15, 0, 0);
    } else if (viewMode === 'plan') {
      camera.position.set(0, 15, 0);
    }
    
    controls.target.set(0, 0, 0);
    controls.update();
  }, [viewMode, camera, controls]);
  
  return null;
}

export default function CanvasEditor3D({ shapes, selectedId, setSelectedId, canvasRef }) {
  const [viewMode, setViewMode] = useState('iso');
  const [showGrid, setShowGrid] = useState(true);

  return (
    <div style={{ position: 'relative', width: '800px', height: '600px', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
      {/* Floating View Controls */}
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', gap: '4px', background: '#ffffff', padding: '6px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <button onClick={() => setShowGrid(!showGrid)} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: showGrid ? '#10b981' : 'transparent', color: showGrid ? 'white' : '#475569', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginRight: '4px' }}>Grid</button>
        <div style={{ width: '1px', background: '#e2e8f0', margin: '4px 4px' }}></div>
        <button onClick={() => setViewMode('iso')} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: viewMode === 'iso' ? '#3b82f6' : 'transparent', color: viewMode === 'iso' ? 'white' : '#475569', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Iso</button>
        <button onClick={() => setViewMode('front')} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: viewMode === 'front' ? '#3b82f6' : 'transparent', color: viewMode === 'front' ? 'white' : '#475569', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Front</button>
        <button onClick={() => setViewMode('side')} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: viewMode === 'side' ? '#3b82f6' : 'transparent', color: viewMode === 'side' ? 'white' : '#475569', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Side</button>
        <button onClick={() => setViewMode('plan')} style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px', background: viewMode === 'plan' ? '#3b82f6' : 'transparent', color: viewMode === 'plan' ? 'white' : '#475569', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Top</button>
      </div>

      <Canvas 
        ref={canvasRef} 
        camera={{ position: [5, 5, 5], fov: 35 }}
        onPointerMissed={() => setSelectedId(null)}
        gl={{ preserveDrawingBuffer: true }} // Important for PNG export
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {showGrid && <Grid infiniteGrid fadeDistance={20} sectionColor="#94a3b8" cellColor="#cbd5e1" />}
        
        {shapes.map(shape => (
          <Shape3D
            key={shape.id}
            shapeProps={shape}
            isSelected={shape.id === selectedId}
            onSelect={() => setSelectedId(shape.id)}
          />
        ))}
        
        <OrbitControls makeDefault />
        <CameraRig viewMode={viewMode} />
      </Canvas>
    </div>
  );
}
