import React, { useRef } from 'react';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';

// Custom Geometries
const createTriangularPrism = () => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(1, 0);
  shape.lineTo(0.5, Math.sqrt(3)/2);
  shape.lineTo(0, 0);
  
  const extrudeSettings = { depth: 1, bevelEnabled: false };
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
};

export default function Shape3D({ shapeProps, isSelected, onSelect }) {
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
        {shapeProps.type === 'cuboid' && <boxGeometry args={[2, 1, 1]} />}
        {shapeProps.type === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
        {shapeProps.type === 'cone' && <coneGeometry args={[0.5, 1, 32]} />}
        {shapeProps.type === 'sphere' && <sphereGeometry args={[0.6, 32, 16]} />}
        {shapeProps.type === 'squarePyramid' && <coneGeometry args={[0.7, 1, 4]} />}
        {shapeProps.type === 'tetrahedron' && <tetrahedronGeometry args={[0.8]} />}
        {shapeProps.type === 'octahedron' && <octahedronGeometry args={[0.8]} />}
        {shapeProps.type === 'triangularPrism' && <primitive object={createTriangularPrism()} />}
        
        {shapeProps.isElevation ? (
          <meshBasicMaterial 
            color="white" 
          />
        ) : (
          <meshStandardMaterial 
            color={shapeProps.color || '#3b82f6'} 
            transparent={true}
            opacity={shapeProps.wireframe ? 0 : (isSelected ? 0.9 : 1)}
            wireframe={false}
          />
        )}
        
        {/* Draw edges for that math diagram look */}
        <Edges 
          scale={1} 
          threshold={15} 
          color={shapeProps.isElevation ? "black" : (shapeProps.wireframe ? (shapeProps.edgeColor || '#3b82f6') : (isSelected ? "white" : "black"))} 
          linewidth={shapeProps.edgeWidth || 1}
        />
      </mesh>
    </group>
  );
}
