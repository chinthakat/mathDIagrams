import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Bounds, OrbitControls } from '@react-three/drei';
import Shape3D from './MathObjects3D/Shape3D';

// viewType can be 'front', 'side', 'plan', or 'isometric'
export default function ElevationViewer({ shapes, viewType, width = 200, height = 200, force3DStyle = false }) {
  const getCameraPosition = () => {
    switch (viewType) {
      case 'front': return [0, 0, 10];
      case 'side': return [10, 0, 0];
      case 'plan': return [0, 10, 0];
      case 'isometric': return [10, 10, 10];
      default: return [0, 0, 10];
    }
  };

  const getCameraRotation = () => {
    switch (viewType) {
      case 'front': return [0, 0, 0];
      case 'side': return [0, Math.PI / 2, 0];
      case 'plan': return [-Math.PI / 2, 0, 0];
      case 'isometric': return [-Math.atan(1/Math.sqrt(2)), Math.PI/4, 0];
      default: return [0, 0, 0];
    }
  };

  return (
    <div style={{ width, height, border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: '4px' }}>
      <Canvas>
        <OrthographicCamera 
          makeDefault 
          position={getCameraPosition()} 
          rotation={getCameraRotation()} 
          zoom={30} 
        />
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} />
        
        <Bounds fit clip observe margin={1.5}>
          <group>
            {shapes.map(shape => (
              <Shape3D
                key={shape.id}
                shapeProps={{ ...shape, isElevation: force3DStyle ? false : viewType !== 'isometric' }}
                isSelected={false}
                onSelect={() => {}}
              />
            ))}
          </group>
        </Bounds>
        
        {(viewType === 'isometric' || force3DStyle) && <OrbitControls enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  );
}
