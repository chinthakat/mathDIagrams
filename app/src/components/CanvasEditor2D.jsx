import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Transformer, Group, Rect, Circle, Line, Path, Arrow } from 'react-konva';
import { getConnectionPoints, resolveEndpoint, findNearestConnectionPoint } from '../utils/connectionUtils';
import { ObjectRegistry } from '../registry/objectRegistry';
import { MousePointer2, Pen, Highlighter, Square as SquareIcon, Circle as CircleIcon, Minus, Shapes, Triangle, Star, Hexagon, ArrowRight, Eraser } from 'lucide-react';

const GRID_SIZE = 20;

// Arrow/connector types that get draggable endpoint handles instead of a Transformer.
// 'connectorArrow' → absolute x1/y1/x2/y2 + optional startBinding/endBinding
// others           → Group(x,y) + relative endX/endY + optional endBinding
const ENDPOINT_EDITABLE = new Set(['connectorArrow', 'dottedLineArrow', 'elbowArrow', 'bezierArrow']);

const ShapeElement = ({ shapeProps, isSelected, onSelect, onDelete, onChange, snapToGrid, allShapes, drawMode, onHoverChange }) => {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const snapValue = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  const dragBoundFunc = (pos) => {
    const parent = shapeRef.current?.getParent();
    if (!parent) return pos;

    // Convert absolute pos to local
    const transform = parent.getAbsoluteTransform().copy();
    transform.invert();
    const localPos = transform.point(pos);

    let newX = localPos.x;
    let newY = localPos.y;

    // 1. Grid Snapping
    if (snapToGrid) {
      newX = snapValue(newX);
      newY = snapValue(newY);
      return parent.getAbsoluteTransform().point({ x: newX, y: newY });
    }

    // 2. Magnetic Road Snapping
    if (shapeProps.type === 'road' || shapeProps.type === 'roadJunction' || shapeProps.type === 'bridge') {
      const localThresh = 20;
      let snappedX = false;
      let snappedY = false;

      const getBounds = (shape) => {
        let w = shape.type === 'roadJunction' ? (shape.size || 150) : (shape.width || (shape.length || 200));
        let h = shape.type === 'roadJunction' ? (shape.size || 150) : (shape.height || (shape.width || 40));
        return { x: shape.x, y: shape.y, w, h };
      };
      
      const myBounds = getBounds(shapeProps);

      if (allShapes) {
        for (const other of allShapes) {
          if (other.id === shapeProps.id) continue;
          if (other.type !== 'road' && other.type !== 'roadJunction' && other.type !== 'bridge') continue;

          const otherBounds = getBounds(other);

          // Center-to-Center snap
          if (!snappedX && Math.abs(newX - otherBounds.x) < localThresh) { newX = otherBounds.x; snappedX = true; }
          if (!snappedY && Math.abs(newY - otherBounds.y) < localThresh) { newY = otherBounds.y; snappedY = true; }

          // Edge-to-Edge snap
          if (!snappedX) {
            const myRightTarget = otherBounds.x - otherBounds.w/2 - myBounds.w/2;
            if (Math.abs(newX - myRightTarget) < localThresh) { newX = myRightTarget; snappedX = true; }
            const myLeftTarget = otherBounds.x + otherBounds.w/2 + myBounds.w/2;
            if (Math.abs(newX - myLeftTarget) < localThresh) { newX = myLeftTarget; snappedX = true; }
          }
          if (!snappedY) {
            const myBottomTarget = otherBounds.y - otherBounds.h/2 - myBounds.h/2;
            if (Math.abs(newY - myBottomTarget) < localThresh) { newY = myBottomTarget; snappedY = true; }
            const myTopTarget = otherBounds.y + otherBounds.h/2 + myBounds.h/2;
            if (Math.abs(newY - myTopTarget) < localThresh) { newY = myTopTarget; snappedY = true; }
          }
        }
      }
    }

    return parent.getAbsoluteTransform().point({ x: newX, y: newY });
  };

  const onDragEnd = (e) => {
    onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() });
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
    onClick: drawMode === 'select' ? onSelect : drawMode === 'eraser' ? onDelete : undefined,
    onTap: drawMode === 'select' ? onSelect : drawMode === 'eraser' ? onDelete : undefined,
    onMouseEnter: drawMode === 'eraser'
      ? (e) => { if (e.evt.buttons === 1) onDelete(); onHoverChange?.(shapeProps.id); }
      : () => onHoverChange?.(shapeProps.id),
    onMouseLeave: () => onHoverChange?.(null),
    ref: shapeRef,
    ...shapeProps,
    draggable: drawMode === 'select',
    listening: drawMode === 'select' || drawMode === 'eraser',
    dragBoundFunc,
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
      {isSelected && !ENDPOINT_EDITABLE.has(shapeProps.type) && (
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

  // Connector / connection-point state
  const [hoveredShapeId, setHoveredShapeId] = useState(null);
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState(false);
  const snapIndicatorRef = useRef(null);

  // Drawing Tools State
  const [drawMode, setDrawMode] = useState('select');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState('md'); // 'sm', 'md', 'lg'
  const [isDrawing, setIsDrawing] = useState(false);
  const [isShapesMenuOpen, setIsShapesMenuOpen] = useState(false);
  
  // Theme state: can bind to parent state or run locally
  const [localMapTheme, setLocalMapTheme] = useState("paper");
  const mapTheme = externalMapTheme !== undefined ? externalMapTheme : localMapTheme;
  const setMapTheme = externalSetMapTheme !== undefined ? externalSetMapTheme : setLocalMapTheme;

  // When a shape that a relative-endpoint arrow is bound to moves,
  // sync endX/endY (and x/y for start bindings) so the Component renders correctly.
  // Converges in ≤2 iterations because the second pass finds no difference.
  useEffect(() => {
    const RELATIVE = new Set(['dottedLineArrow', 'elbowArrow', 'bezierArrow']);
    const updates = [];

    shapes.forEach(shape => {
      if (!RELATIVE.has(shape.type)) return;
      const sx = shape.x ?? 0, sy = shape.y ?? 0;
      const absEndX = sx + (shape.endX ?? 150);
      const absEndY = sy + (shape.endY ?? 0);

      if (shape.endBinding) {
        const resolved = resolveEndpoint(shape.endBinding, absEndX, absEndY, shapes);
        const newEndX = resolved.x - sx;
        const newEndY = resolved.y - sy;
        if (Math.abs(newEndX - (shape.endX ?? 150)) > 0.5 || Math.abs(newEndY - (shape.endY ?? 0)) > 0.5) {
          updates.push({ id: shape.id, endX: newEndX, endY: newEndY });
        }
      }

      if (shape.startBinding) {
        const resolved = resolveEndpoint(shape.startBinding, sx, sy, shapes);
        if (Math.abs(resolved.x - sx) > 0.5 || Math.abs(resolved.y - sy) > 0.5) {
          updates.push({ id: shape.id, x: resolved.x, y: resolved.y, endX: absEndX - resolved.x, endY: absEndY - resolved.y });
        }
      }
    });

    if (updates.length > 0) {
      setShapes(prev => prev.map(s => {
        const u = updates.find(u => u.id === s.id);
        return u ? { ...s, ...u } : s;
      }));
    }
  }, [shapes]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const getScaledPointerPosition = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    return {
      x: (pos.x - stageConfig.x) / stageConfig.scale,
      y: (pos.y - stageConfig.y) / stageConfig.scale
    };
  };

  const handleStageMouseDown = (e) => {
    if (drawMode === 'select' || drawMode === 'eraser') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty && drawMode === 'select') {
        setSelectedId(null);
      }
      return;
    }

    setIsDrawing(true);
    const pos = getScaledPointerPosition(e);
    
    let newShape = {
      id: `draw-${Date.now()}`,
      x: pos.x,
      y: pos.y,
      rotation: 0
    };

    let strokeWidth = brushSize === 'sm' ? 2 : brushSize === 'lg' ? 8 : 4;
    let highlighterWidth = brushSize === 'sm' ? 10 : brushSize === 'lg' ? 30 : 18;

    if (drawMode === 'pen' || drawMode === 'highlighter') {
      newShape = {
        ...newShape,
        type: 'freehand',
        points: [0, 0, 0, 0],
        stroke: drawColor,
        strokeWidth: drawMode === 'highlighter' ? highlighterWidth : strokeWidth,
        opacity: drawMode === 'highlighter' ? 0.4 : 1,
        tension: 0.5
      };
    } else if (drawMode === 'line') {
      newShape = {
        ...newShape,
        type: 'freehand',
        points: [0, 0, 0, 0],
        stroke: drawColor,
        strokeWidth: strokeWidth,
        opacity: 1,
        tension: 0
      };
    } else if (drawMode === 'rect') {
      newShape = {
        ...newShape,
        type: 'drawRect',
        width: 0,
        height: 0,
        stroke: drawColor,
        strokeWidth: strokeWidth
      };
    } else if (drawMode === 'ellipse') {
      newShape = {
        ...newShape,
        type: 'drawEllipse',
        radiusX: 0,
        radiusY: 0,
        stroke: drawColor,
        strokeWidth: strokeWidth
      };
    }

    setShapes([...shapes, newShape]);
  };

  const handleStageMouseMove = (e) => {
    if (!isDrawing || drawMode === 'select') return;
    
    const pos = getScaledPointerPosition(e);
    const newShapes = [...shapes];
    const lastShape = { ...newShapes[newShapes.length - 1] };

    if (drawMode === 'pen' || drawMode === 'highlighter') {
      lastShape.points = lastShape.points.concat([pos.x - lastShape.x, pos.y - lastShape.y]);
    } else if (drawMode === 'line') {
      lastShape.points = [0, 0, pos.x - lastShape.x, pos.y - lastShape.y];
    } else if (drawMode === 'rect') {
      lastShape.width = pos.x - lastShape.x;
      lastShape.height = pos.y - lastShape.y;
    } else if (drawMode === 'ellipse') {
      lastShape.radiusX = Math.abs(pos.x - lastShape.x);
      lastShape.radiusY = Math.abs(pos.y - lastShape.y);
    }

    newShapes[newShapes.length - 1] = lastShape;
    setShapes(newShapes, true); // skip history during draw
  };

  const handleStageMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setShapes([...shapes]); // final state, record history
    }
  };

  const stampShape = (type, overrideProps = {}) => {
    // Get center of current view
    const centerX = -stageConfig.x / stageConfig.scale + dimensions.width / 2 / stageConfig.scale;
    const centerY = -stageConfig.y / stageConfig.scale + dimensions.height / 2 / stageConfig.scale;

    const baseShape = ObjectRegistry[type]?.defaultProps || {};
    const newShapeId = `${type}-${Date.now()}`;

    // Connector arrows use x1/y1/x2/y2 instead of a single x/y anchor
    const posProps = type === 'connectorArrow'
      ? { x1: centerX - 80, y1: centerY, x2: centerX + 80, y2: centerY }
      : { x: centerX, y: centerY };

    const newShape = {
      ...baseShape,
      ...overrideProps,
      id: newShapeId,
      type: type,
      ...posProps,
    };

    setShapes([...shapes, newShape]);
    setSelectedId(newShapeId);
    setDrawMode('select');
    setIsShapesMenuOpen(false);
  };

  const updateShape = (id, newProps, skipHistory = false) => {
    setShapes(shapes.map((shape) => (shape.id === id ? { ...shape, ...newProps } : shape)), skipHistory);
  };

  const deleteShape = (id) => {
    setShapes(shapes.filter((shape) => shape.id !== id));
    if (selectedId === id) setSelectedId(null);
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

      {/* Drawing Toolbar Overlay */}
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: '#1e293b', padding: '8px', borderRadius: '30px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'select', icon: <MousePointer2 size={16} />, title: 'Select & Move' },
            { id: 'pen', icon: <Pen size={16} />, title: 'Pen' },
            { id: 'highlighter', icon: <Highlighter size={16} />, title: 'Highlighter' },
            { id: 'eraser', icon: <Eraser size={16} />, title: 'Eraser (Stroke Eraser)' },
            { id: 'line', icon: <Minus size={16} />, title: 'Line' },
            { id: 'rect', icon: <SquareIcon size={16} />, title: 'Rectangle' },
            { id: 'ellipse', icon: <CircleIcon size={16} />, title: 'Ellipse' }
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => { setDrawMode(tool.id); setSelectedId(null); setIsShapesMenuOpen(false); }}
              title={tool.title}
              style={{
                width: '36px', height: '36px', borderRadius: '18px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s',
                background: drawMode === tool.id ? '#3b82f6' : 'transparent',
                color: drawMode === tool.id ? 'white' : '#94a3b8'
              }}
            >
              {tool.icon}
            </button>
          ))}
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsShapesMenuOpen(!isShapesMenuOpen)}
              title="Quick Shapes"
              style={{
                width: '36px', height: '36px', borderRadius: '18px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s',
                background: isShapesMenuOpen ? '#3b82f6' : 'transparent',
                color: isShapesMenuOpen ? 'white' : '#94a3b8'
              }}
            >
              <Shapes size={16} />
            </button>
            
            {isShapesMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                {[
                  { type: 'triangle', icon: <Triangle size={16} />, label: 'Triangle' },
                  { type: 'polygon', overrides: { sides: 5 }, icon: <Star size={16} />, label: 'Pentagon' },
                  { type: 'polygon', overrides: { sides: 6 }, icon: <Hexagon size={16} />, label: 'Hexagon' },
                  { type: 'connectorArrow', icon: <ArrowRight size={16} />, label: 'Connector' },
                  { type: 'line', overrides: { pointerWidth: 10, pointerLength: 10 }, icon: <ArrowRight size={16} />, label: 'Arrow' },
                  { type: 'point', icon: <CircleIcon size={16} fill="currentColor" />, label: 'Point' }
                ].map(s => (
                  <button 
                    key={s.label}
                    onClick={() => stampShape(s.type, s.overrides || {})}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ width: '1px', height: '24px', background: '#334155' }} />
        
        {/* Brush Size Selector */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0 4px' }}>
          {['sm', 'md', 'lg'].map((size, i) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              title={`${size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'} Brush`}
              style={{
                width: '24px', height: '24px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                background: brushSize === size ? '#334155' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <div style={{ width: `${(i+1)*3 + 2}px`, height: `${(i+1)*3 + 2}px`, borderRadius: '50%', background: brushSize === size ? '#fff' : '#94a3b8' }} />
            </button>
          ))}
        </div>
        
        <div style={{ width: '1px', height: '24px', background: '#334155' }} />
        <div style={{ display: 'flex', gap: '6px', paddingRight: '8px' }}>
          {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#000000', '#ffffff'].map(color => (
            <button
              key={color}
              onClick={() => setDrawColor(color)}
              title={color}
              style={{
                width: '24px', height: '24px', borderRadius: '12px', border: drawColor === color ? '2px solid white' : '1px solid #334155', cursor: 'pointer',
                background: color, transform: drawColor === color ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s'
              }}
            />
          ))}
        </div>
      </div>

      <Stage
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleStageMouseDown}
        onTouchStart={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchEnd={handleStageMouseUp}
        onWheel={handleWheel}
        draggable={drawMode === 'select'}
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

          {/* Regular (non-connector) shapes */}
          {shapes.filter(s => s.type !== 'connectorArrow').map((shape) => (
            <ShapeElement
              key={shape.id}
              shapeProps={shape}
              isSelected={shape.id === selectedId}
              onSelect={() => setSelectedId(shape.id)}
              onDelete={() => deleteShape(shape.id)}
              onChange={(newProps, skipHistory) => updateShape(shape.id, newProps, skipHistory)}
              snapToGrid={snapToGrid}
              allShapes={shapes}
              drawMode={drawMode}
              onHoverChange={drawMode === 'select' ? setHoveredShapeId : undefined}
            />
          ))}

          {/* Connector arrow lines */}
          {shapes.filter(s => s.type === 'connectorArrow').map(conn => {
            const start = resolveEndpoint(conn.startBinding, conn.x1 ?? conn.x ?? 0, conn.y1 ?? conn.y ?? 0, shapes);
            const end   = resolveEndpoint(conn.endBinding,   conn.x2 ?? (conn.x ?? 0) + 150, conn.y2 ?? conn.y ?? 0, shapes);
            const isSelected = conn.id === selectedId;
            return (
              <Arrow
                key={conn.id}
                points={[start.x, start.y, end.x, end.y]}
                stroke={isSelected ? '#3b82f6' : (conn.stroke || '#94a3b8')}
                strokeWidth={conn.strokeWidth || 2}
                pointerLength={conn.pointerAtEnd !== false ? 10 : 0}
                pointerWidth={conn.pointerAtEnd  !== false ? 10 : 0}
                fill={isSelected ? '#3b82f6' : (conn.stroke || '#94a3b8')}
                dash={conn.dash ? [8, 4] : undefined}
                hitStrokeWidth={16}
                listening={drawMode === 'select' || drawMode === 'eraser'}
                onClick={() => {
                  if (drawMode === 'select') { setSelectedId(conn.id); setHoveredShapeId(null); }
                  if (drawMode === 'eraser') deleteShape(conn.id);
                }}
                onTap={() => drawMode === 'select' && setSelectedId(conn.id)}
              />
            );
          })}

          {/* ── Connection-point overlay ── */}

          {/* Dots on hovered shape (or all shapes while dragging an endpoint) */}
          {(isDraggingEndpoint
            ? shapes.filter(s => s.type !== 'connectorArrow' && s.type !== 'freehand')
            : hoveredShapeId ? [shapes.find(s => s.id === hoveredShapeId)].filter(Boolean) : []
          ).flatMap(shape =>
            getConnectionPoints(shape).map((pt, i) => (
              <Circle
                key={`cp-${shape.id}-${i}`}
                x={pt.x}
                y={pt.y}
                radius={5}
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth={1.5}
                opacity={0.9}
                listening={false}
              />
            ))
          )}

          {/* Snap-target ring (imperatively controlled — no React state change during drag) */}
          <Circle
            ref={snapIndicatorRef}
            x={0}
            y={0}
            radius={11}
            fill="rgba(59,130,246,0.18)"
            stroke="#3b82f6"
            strokeWidth={2.5}
            visible={false}
            listening={false}
          />

          {/* Endpoint handles for selected connectors / arrow shapes */}
          {(() => {
            if (!selectedId || drawMode !== 'select') return null;
            const shape = shapes.find(s => s.id === selectedId);
            if (!shape || !ENDPOINT_EDITABLE.has(shape.type)) return null;

            // ── Resolve absolute start & end positions ─────────────────────
            let start, end, onStartCommit, onEndCommit;

            if (shape.type === 'connectorArrow') {
              start = resolveEndpoint(shape.startBinding, shape.x1 ?? shape.x ?? 0, shape.y1 ?? shape.y ?? 0, shapes);
              end   = resolveEndpoint(shape.endBinding,   shape.x2 ?? (shape.x ?? 0) + 150, shape.y2 ?? shape.y ?? 0, shapes);

              onStartCommit = (p, snap) => {
                const binding = snap ? { shapeId: snap.shapeId, pointIndex: snap.pointIndex } : null;
                updateShape(shape.id, { x1: snap?.x ?? p.x, y1: snap?.y ?? p.y, startBinding: binding });
              };
              onEndCommit = (p, snap) => {
                const binding = snap ? { shapeId: snap.shapeId, pointIndex: snap.pointIndex } : null;
                updateShape(shape.id, { x2: snap?.x ?? p.x, y2: snap?.y ?? p.y, endBinding: binding });
              };
            } else {
              // Relative-endpoint types: dottedLineArrow, elbowArrow, bezierArrow
              // Group is at (x, y); arrow tip is at (x + endX, y + endY).
              const sx = shape.x ?? 0, sy = shape.y ?? 0;
              const absEndX = sx + (shape.endX ?? 150);
              const absEndY = sy + (shape.endY ?? 0);

              start = resolveEndpoint(shape.startBinding ?? null, sx, sy, shapes);
              end   = resolveEndpoint(shape.endBinding   ?? null, absEndX, absEndY, shapes);

              onStartCommit = (p, snap) => {
                const fx = snap?.x ?? p.x, fy = snap?.y ?? p.y;
                const binding = snap ? { shapeId: snap.shapeId, pointIndex: snap.pointIndex } : null;
                // Keep absolute end fixed while moving start
                updateShape(shape.id, {
                  x: fx, y: fy,
                  endX: absEndX - fx, endY: absEndY - fy,
                  startBinding: binding,
                });
              };
              onEndCommit = (p, snap) => {
                const fx = snap?.x ?? p.x, fy = snap?.y ?? p.y;
                const binding = snap ? { shapeId: snap.shapeId, pointIndex: snap.pointIndex } : null;
                updateShape(shape.id, {
                  endX: fx - sx, endY: fy - sy,
                  endBinding: binding,
                });
              };
            }

            // ── Shared draggable handle factory ────────────────────────────
            const makeHandle = (pos, endKey, onCommit) => (
              <Circle
                key={`ep-${shape.id}-${endKey}`}
                x={pos.x}
                y={pos.y}
                radius={7}
                fill={endKey === 'start' ? '#10b981' : '#f59e0b'}
                stroke="#ffffff"
                strokeWidth={2.5}
                draggable
                onDragStart={() => { setIsDraggingEndpoint(true); setHoveredShapeId(null); }}
                onDragMove={(e) => {
                  const p = { x: e.target.x(), y: e.target.y() };
                  const snap = findNearestConnectionPoint(p, shapes, shape.id);
                  if (snap) {
                    e.target.x(snap.x); e.target.y(snap.y);
                    if (snapIndicatorRef.current) {
                      snapIndicatorRef.current.x(snap.x);
                      snapIndicatorRef.current.y(snap.y);
                      snapIndicatorRef.current.visible(true);
                      snapIndicatorRef.current.getLayer()?.batchDraw();
                    }
                  } else if (snapIndicatorRef.current) {
                    snapIndicatorRef.current.visible(false);
                    snapIndicatorRef.current.getLayer()?.batchDraw();
                  }
                }}
                onDragEnd={(e) => {
                  setIsDraggingEndpoint(false);
                  if (snapIndicatorRef.current) snapIndicatorRef.current.visible(false);
                  const p = { x: e.target.x(), y: e.target.y() };
                  const snap = findNearestConnectionPoint(p, shapes, shape.id);
                  onCommit(p, snap ?? null);
                }}
              />
            );

            return [
              makeHandle(start, 'start', onStartCommit),
              makeHandle(end,   'end',   onEndCommit),
            ];
          })()}
        </Layer>
      </Stage>
    </div>
  );
}
