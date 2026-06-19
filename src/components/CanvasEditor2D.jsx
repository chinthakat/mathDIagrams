import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Transformer, Group, Rect, Circle, Line, Path } from 'react-konva';
import { ObjectRegistry } from '../registry/objectRegistry';

const GRID_SIZE = 20;

const ShapeElement = ({ shapeProps, isSelected, onSelect, onChange, snapToGrid }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const snapValue = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  const onDragEnd = (e) => {
    let newX = e.target.x();
    let newY = e.target.y();
    if (snapToGrid) {
      newX = snapValue(newX);
      newY = snapValue(newY);
      e.target.x(newX);
      e.target.y(newY);
    }
    onChange({ ...shapeProps, x: newX, y: newY });
  };

  const onTransformEnd = (e) => {
    const node = shapeRef.current;
    let newX = node.x();
    let newY = node.y();
    if (snapToGrid) {
      newX = snapValue(newX);
      newY = snapValue(newY);
      node.x(newX);
      node.y(newY);
    }
    onChange({
      ...shapeProps,
      x: newX,
      y: newY,
      rotation: node.rotation(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
    });
  };

  const commonProps = {
    onClick: onSelect,
    onTap: onSelect,
    ref: shapeRef,
    ...shapeProps,
    draggable: true,
    onDragEnd,
    onTransformEnd,
  };

  const regObj = ObjectRegistry[shapeProps.type];
  const ComponentToRender = regObj ? regObj.Component : null;

  return (
    <React.Fragment>
      <Group {...commonProps}>
        {ComponentToRender && <ComponentToRender props={shapeProps} />}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

// Component to render decorative background elements based on themes
const BackgroundDecorations = ({ theme }) => {
  if (theme === 'parchment') {
    // Elegant compass lines & rings radiating from center
    const radius = 250;
    const lines = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      lines.push(
        <Line
          key={`rhumb-${i}`}
          points={[0, 0, Math.cos(angle) * 800, Math.sin(angle) * 800]}
          stroke="#8c7b65"
          strokeWidth={0.5}
          opacity={0.12}
        />
      );
    }
    return (
      <Group x={400} y={300}>
        {lines}
        <Circle radius={120} stroke="#8c7b65" strokeWidth={1} dash={[4, 6]} opacity={0.2} />
        <Circle radius={200} stroke="#8c7b65" strokeWidth={1.5} opacity={0.15} />
      </Group>
    );
  }

  if (theme === 'topography') {
    // Organic elevation contour curves
    const contours = [];
    const seedCenters = [
      { cx: 200, cy: 150, radii: [50, 90, 140, 200] },
      { cx: 600, cy: 450, radii: [40, 80, 130, 190] }
    ];

    seedCenters.forEach((center, idx) => {
      center.radii.forEach((r, rIdx) => {
        const points = [];
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          // Organic variation in contour line
          const rVar = r * (0.9 + 0.12 * Math.sin(angle * 3 + rIdx));
          points.push(center.cx + Math.cos(angle) * rVar, center.cy + Math.sin(angle) * rVar);
        }
        contours.push(
          <Line
            key={`topo-${idx}-${rIdx}`}
            points={points}
            stroke="#cbbca1"
            strokeWidth={1}
            opacity={0.35}
            tension={0.5}
            closed={true}
          />
        );
      });
    });

    return <Group>{contours}</Group>;
  }

  if (theme === 'grassland') {
    // Little grass blade clusters
    const clusters = [
      { x: 100, y: 100 }, { x: 300, y: 80 }, { x: 220, y: 240 },
      { x: 150, y: 450 }, { x: 450, y: 120 }, { x: 500, y: 350 },
      { x: 680, y: 150 }, { x: 720, y: 400 }, { x: 350, y: 490 }
    ];

    return (
      <Group>
        {clusters.map((c, i) => (
          <Group key={`grass-${i}`} x={c.x} y={c.y}>
            <Line points={[-3, 4, -5, -2]} stroke="#15803d" strokeWidth={1} opacity={0.25} tension={0.2} />
            <Line points={[0, 4, 0, -4]} stroke="#15803d" strokeWidth={1.2} opacity={0.3} tension={0.2} />
            <Line points={[3, 4, 5, -1]} stroke="#15803d" strokeWidth={1} opacity={0.25} tension={0.2} />
          </Group>
        ))}
      </Group>
    );
  }

  if (theme === 'desert') {
    // Sand dune curves
    return (
      <Group>
        <Line points={[0, 100, 200, 120, 500, 90, 800, 110]} stroke="#eab308" strokeWidth={1.5} tension={0.5} opacity={0.15} />
        <Line points={[0, 280, 300, 260, 600, 290, 800, 270]} stroke="#eab308" strokeWidth={1.5} tension={0.5} opacity={0.15} />
        <Line points={[0, 450, 150, 470, 450, 430, 800, 460]} stroke="#eab308" strokeWidth={1.5} tension={0.5} opacity={0.15} />
      </Group>
    );
  }

  if (theme === 'ocean') {
    // Ocean wave ripples in the background
    return (
      <Group>
        <Path data="M 50 150 Q 60 145 70 150 Q 80 145 90 150" stroke="#bae6fd" strokeWidth={1.5} opacity={0.4} />
        <Path data="M 350 80 Q 360 75 370 80 Q 380 75 390 80" stroke="#bae6fd" strokeWidth={1.5} opacity={0.4} />
        <Path data="M 200 400 Q 210 395 220 400 Q 230 395 240 400" stroke="#bae6fd" strokeWidth={1.5} opacity={0.4} />
        <Path data="M 600 250 Q 610 245 620 250 Q 630 245 640 250" stroke="#bae6fd" strokeWidth={1.5} opacity={0.4} />
        <Path data="M 650 480 Q 660 475 670 480 Q 680 475 690 480" stroke="#bae6fd" strokeWidth={1.5} opacity={0.4} />
      </Group>
    );
  }

  return null;
};

export default function CanvasEditor2D({ 
  shapes, 
  setShapes, 
  selectedId, 
  setSelectedId, 
  stageRef, 
  showGrid = true, 
  theme = "dark",
  mapTheme: externalMapTheme,
  setMapTheme: externalSetMapTheme,
  hideLocalControls = false
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stageConfig, setStageConfig] = useState({ scale: 1, x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(showGrid);
  
  // Theme state: can bind to parent state or run locally
  const [localMapTheme, setLocalMapTheme] = useState("paper");
  const mapTheme = externalMapTheme !== undefined ? externalMapTheme : localMapTheme;
  const setMapTheme = externalSetMapTheme !== undefined ? externalSetMapTheme : setLocalMapTheme;

  // Resize Observer for full-bleed canvas
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const boundedScale = Math.max(0.1, Math.min(newScale, 10)); // Limit zoom

    setStageConfig({
      scale: boundedScale,
      x: pointer.x - mousePointTo.x * boundedScale,
      y: pointer.y - mousePointTo.y * boundedScale,
    });
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  };

  const updateShape = (id, newProps) => {
    setShapes(shapes.map((shape) => (shape.id === id ? { ...shape, ...newProps } : shape)));
  };

  // Dynamic CSS grid sizing based on zoom and pan
  const bgSize = `${GRID_SIZE * stageConfig.scale}px ${GRID_SIZE * stageConfig.scale}px`;
  const bgPos = `${stageConfig.x}px ${stageConfig.y}px`;

  // Extended high-fidelity Map Themes
  const themes = {
    dark: { bgColor: '#0f172a', gridColor: '#1e293b' },
    paper: { bgColor: '#fcfaf7', gridColor: '#f1ebd9' },
    parchment: { bgColor: '#f4ebd0', gridColor: '#e3d5b5' },
    topography: { bgColor: '#faf8f2', gridColor: '#ece3ce' },
    grassland: { bgColor: '#f0fdf4', gridColor: '#dcfce7' },
    desert: { bgColor: '#fffbeb', gridColor: '#fef3c7' },
    ocean: { bgColor: '#f0f9ff', gridColor: '#e0f2fe' },
    blueprint: { bgColor: '#0b1d3a', gridColor: '#1e3a6a' }
  };

  const currentTheme = themes[mapTheme] || themes.paper;

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        backgroundColor: currentTheme.bgColor,
        backgroundImage: showGrid ? `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)` : 'none',
        backgroundSize: bgSize,
        backgroundPosition: bgPos,
      }}
    >
      {/* Controls overlay - hide if running inside dedicated MapEditor */}
      {!hideLocalControls && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#fff', userSelect: 'none' }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} />
              Snap to Grid (20px)
            </label>
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <span>Theme:</span>
              <select 
                value={mapTheme} 
                onChange={e => setMapTheme(e.target.value)}
                style={{ background: '#334155', border: 'none', color: 'white', borderRadius: '4px', padding: '4px' }}
              >
                <option value="dark">Dark</option>
                <option value="paper">Paper</option>
                <option value="parchment">Parchment</option>
                <option value="topography">Topography</option>
                <option value="grassland">Grassland</option>
                <option value="desert">Desert</option>
                <option value="ocean">Ocean</option>
                <option value="blueprint">Blueprint</option>
              </select>
            </label>
          </div>
        </div>
      )}

      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
        onWheel={handleWheel}
        draggable
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setStageConfig(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }));
          }
        }}
        scaleX={stageConfig.scale}
        scaleY={stageConfig.scale}
        x={stageConfig.x}
        y={stageConfig.y}
        ref={stageRef}
      >
        <Layer>
          {/* Beautiful vector background decorations moving with stage */}
          <BackgroundDecorations theme={mapTheme} />

          {shapes.map((shape) => (
            <ShapeElement
              key={shape.id}
              shapeProps={shape}
              isSelected={shape.id === selectedId}
              onSelect={() => setSelectedId(shape.id)}
              onChange={(newProps) => updateShape(shape.id, newProps)}
              snapToGrid={snapToGrid}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
