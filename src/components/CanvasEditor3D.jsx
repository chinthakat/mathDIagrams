import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, Grid } from '@react-three/drei';

const Shape3D = ({ shapeProps, isSelected, onSelect }) => {
  const meshRef = useRef();

  return (
    <group 
      position={[shapeProps.x || 0, shapeProps.y || 0, shapeProps.z || 0]}
      rotation={[shapeProps.rotationX || 0, shapeProps.rotationY || 0, shapeProps.rotationZ || 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <mesh ref={meshRef}>
        {shapeProps.type === 'cube' && <boxGeometry args={[1, 1, 1]} />}
        {shapeProps.type === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
        {shapeProps.type === 'sphere' && <sphereGeometry args={[0.6, 32, 16]} />}
        
        <meshStandardMaterial 
          color={shapeProps.color || '#3b82f6'} 
          transparent={true}
          opacity={isSelected ? 0.9 : 1}
        />
        
        {/* Draw edges for that math diagram look */}
        <Edges scale={1} threshold={15} color={isSelected ? "white" : "black"} />
      </mesh>
    </group>
  );
};

export default function CanvasEditor3D({ shapes, selectedId, setSelectedId, canvasRef }) {
  return (
    <div style={{ width: '800px', height: '600px', backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
      <Canvas 
        ref={canvasRef} 
        camera={{ position: [5, 5, 5], fov: 25 }}
        onPointerMissed={() => setSelectedId(null)}
        gl={{ preserveDrawingBuffer: true }} // Important for PNG export
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Grid infiniteGrid fadeDistance={20} sectionColor="#94a3b8" cellColor="#cbd5e1" />
        
        {shapes.map(shape => (
          <Shape3D
            key={shape.id}
            shapeProps={shape}
            isSelected={shape.id === selectedId}
            onSelect={() => setSelectedId(shape.id)}
          />
        ))}
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
