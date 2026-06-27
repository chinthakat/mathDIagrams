import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Transformer, Group, Rect, Circle, Line, Path, Arrow, Text } from 'react-konva';
import {
  getConnectionPoints, resolveEndpoint, findNearestConnectionPoint,
  computeOrthoPath, getSegmentMidpoints, computeAlignmentGuides,
} from '../utils/connectionUtils';
import { ObjectRegistry } from '../registry/objectRegistry';
import {
  MousePointer2, Pen, Highlighter, Square as SquareIcon, Circle as CircleIcon,
  Minus, Shapes, Triangle, Star, Hexagon, ArrowRight, Eraser, Workflow,
  ChevronUp, ChevronDown,
} from 'lucide-react';

const GRID_SIZE = 20;

// Types rendered with endpoint handles instead of a Transformer box
const ENDPOINT_EDITABLE = new Set(['connectorArrow', 'orthoConnector', 'dottedLineArrow', 'elbowArrow', 'bezierArrow']);
// Pure connector types (no ShapeElement Group)
const CONNECTOR_TYPES   = new Set(['connectorArrow', 'orthoConnector']);

// ── Arrowhead renderer ────────────────────────────────────────────────────────
function ArrowHead({ x, y, angle, style = 'filled', color = '#64748b', size = 11 }) {
  if (!style || style === 'none') return null;
  const c = Math.cos(angle), s = Math.sin(angle);
  if (style === 'filled') {
    const len = size, wid = size * 0.6;
    const d = `M ${x} ${y} L ${x - c*len + s*wid} ${y - s*len - c*wid} L ${x - c*len - s*wid} ${y - s*len + c*wid} Z`;
    return <Path data={d} fill={color} listening={false} />;
  }
  if (style === 'open') {
    const len = size, wid = size * 0.6;
    return <Line points={[x - c*len + s*wid, y - s*len - c*wid, x, y, x - c*len - s*wid, y - s*len + c*wid]} stroke={color} strokeWidth={2} listening={false} />;
  }
  if (style === 'circle') {
    return <Circle x={x - c*size*0.5} y={y - s*size*0.5} radius={size * 0.5} fill={color} listening={false} />;
  }
  if (style === 'diamond') {
    const len = size, half = size * 0.45;
    const d = `M ${x} ${y} L ${x - c*len + s*half} ${y - s*len - c*half} L ${x - c*len*2} ${y - s*len*2} L ${x - c*len - s*half} ${y - s*len + c*half} Z`;
    return <Path data={d} fill={color} listening={false} />;
  }
  return null;
}

// ── ShapeElement ──────────────────────────────────────────────────────────────
const ShapeElement = ({
  shapeProps, isSelected, onSelect, onDelete, onChange,
  snapToGrid, allShapes, drawMode, onHoverChange, onDragGuide, onDragEnd: onDragEndCb,
}) => {
  const shapeRef = useRef();
  const trRef    = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current && !ENDPOINT_EDITABLE.has(shapeProps.type)) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, shapeProps.type]);

  const snapValue = v => Math.round(v / GRID_SIZE) * GRID_SIZE;

  const dragBoundFunc = pos => {
    const parent = shapeRef.current?.getParent();
    if (!parent) return pos;
    const transform = parent.getAbsoluteTransform().copy();
    transform.invert();
    let { x: newX, y: newY } = transform.point(pos);

    if (snapToGrid) {
      newX = snapValue(newX);
      newY = snapValue(newY);
      return parent.getAbsoluteTransform().point({ x: newX, y: newY });
    }

    // Road magnetic snap (preserved from original)
    if (['road', 'roadJunction', 'bridge'].includes(shapeProps.type)) {
      const thresh = 20;
      const getBounds = sh => {
        const w = sh.type === 'roadJunction' ? (sh.size || 150) : (sh.width || sh.length || 200);
        const h = sh.type === 'roadJunction' ? (sh.size || 150) : (sh.height || sh.width || 40);
        return { x: sh.x, y: sh.y, w, h };
      };
      const myB = getBounds(shapeProps);
      let sx = false, sy = false;
      for (const other of (allShapes || [])) {
        if (other.id === shapeProps.id || !['road','roadJunction','bridge'].includes(other.type)) continue;
        const ob = getBounds(other);
        if (!sx && Math.abs(newX - ob.x) < thresh) { newX = ob.x; sx = true; }
        if (!sy && Math.abs(newY - ob.y) < thresh) { newY = ob.y; sy = true; }
        if (!sx && Math.abs(newX - (ob.x - ob.w/2 - myB.w/2)) < thresh) { newX = ob.x - ob.w/2 - myB.w/2; sx = true; }
        if (!sx && Math.abs(newX - (ob.x + ob.w/2 + myB.w/2)) < thresh) { newX = ob.x + ob.w/2 + myB.w/2; sx = true; }
        if (!sy && Math.abs(newY - (ob.y - ob.h/2 - myB.h/2)) < thresh) { newY = ob.y - ob.h/2 - myB.h/2; sy = true; }
        if (!sy && Math.abs(newY - (ob.y + ob.h/2 + myB.h/2)) < thresh) { newY = ob.y + ob.h/2 + myB.h/2; sy = true; }
      }
    }
    return parent.getAbsoluteTransform().point({ x: newX, y: newY });
  };

  const onDragEnd = e => {
    onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() });
    onDragEndCb?.();
  };

  const onDragMove = e => {
    const pos = { ...shapeProps, x: e.target.x(), y: e.target.y() };
    if (!snapToGrid) {
      const gs = computeAlignmentGuides(pos, allShapes || [], 1);
      // Snap imperatively
      let nx = e.target.x(), ny = e.target.y();
      gs.forEach(g => {
        if (g.axis === 'h' && g.snapY !== undefined) ny = g.snapY;
        if (g.axis === 'v' && g.snapX !== undefined) nx = g.snapX;
      });
      e.target.x(nx);
      e.target.y(ny);
      onDragGuide?.(gs);
    }
  };

  const onTransformEnd = e => {
    const node = shapeRef.current;
    let newX = node.x(), newY = node.y();
    if (snapToGrid) { newX = snapValue(newX); newY = snapValue(newY); node.x(newX); node.y(newY); }
    onChange({ ...shapeProps, x: newX, y: newY, rotation: node.rotation(), scaleX: node.scaleX(), scaleY: node.scaleY() });
  };

  const isConnMode = drawMode === 'connector';
  const commonProps = {
    onClick:  (drawMode === 'select' || isConnMode) ? onSelect : drawMode === 'eraser' ? onDelete : undefined,
    onTap:    (drawMode === 'select' || isConnMode) ? onSelect : drawMode === 'eraser' ? onDelete : undefined,
    onMouseEnter: drawMode === 'eraser'
      ? e => { if (e.evt.buttons === 1) onDelete(); onHoverChange?.(shapeProps.id); }
      : () => onHoverChange?.(shapeProps.id),
    onMouseLeave: () => onHoverChange?.(null),
    ref: shapeRef,
    ...shapeProps,
    draggable: drawMode === 'select',
    listening: drawMode === 'select' || drawMode === 'eraser' || isConnMode,
    dragBoundFunc,
    onDragEnd,
    onDragMove,
    onTransformEnd,
  };

  const ComponentToRender = ObjectRegistry[shapeProps.type]?.Component;

  return (
    <React.Fragment>
      <Group {...commonProps}>
        {ComponentToRender && <ComponentToRender props={shapeProps} />}
      </Group>
      {isSelected && !ENDPOINT_EDITABLE.has(shapeProps.type) && (
        <Transformer ref={trRef} boundBoxFunc={(o, n) => (n.width < 5 || n.height < 5 ? o : n)} />
      )}
    </React.Fragment>
  );
};

// ── Background decorations (unchanged) ───────────────────────────────────────
const BackgroundDecorations = ({ theme }) => {
  if (theme === 'parchment') {
    const lines = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      lines.push(<Line key={`r-${i}`} points={[0, 0, Math.cos(angle) * 800, Math.sin(angle) * 800]} stroke="#8c7b65" strokeWidth={0.5} opacity={0.12} />);
    }
    return <Group x={400} y={300}>{lines}<Circle radius={120} stroke="#8c7b65" strokeWidth={1} dash={[4,6]} opacity={0.2} /><Circle radius={200} stroke="#8c7b65" strokeWidth={1.5} opacity={0.15} /></Group>;
  }
  if (theme === 'topography') {
    const contours = [];
    [{ cx:200,cy:150,radii:[50,90,140,200] },{ cx:600,cy:450,radii:[40,80,130,190] }].forEach((c,ci) => {
      c.radii.forEach((r,ri) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) { const a=(i/10)*Math.PI*2, rv=r*(0.9+0.12*Math.sin(a*3+ri)); pts.push(c.cx+Math.cos(a)*rv, c.cy+Math.sin(a)*rv); }
        contours.push(<Line key={`t-${ci}-${ri}`} points={pts} stroke="#cbbca1" strokeWidth={1} opacity={0.35} tension={0.5} closed />);
      });
    });
    return <Group>{contours}</Group>;
  }
  if (theme === 'grassland') {
    const clusters = [{x:100,y:100},{x:300,y:80},{x:220,y:240},{x:150,y:450},{x:450,y:120},{x:500,y:350},{x:680,y:150},{x:720,y:400},{x:350,y:490}];
    return <Group>{clusters.map((c,i) => <Group key={i} x={c.x} y={c.y}><Line points={[-3,4,-5,-2]} stroke="#15803d" strokeWidth={1} opacity={0.25} tension={0.2}/><Line points={[0,4,0,-4]} stroke="#15803d" strokeWidth={1.2} opacity={0.3} tension={0.2}/><Line points={[3,4,5,-1]} stroke="#15803d" strokeWidth={1} opacity={0.25} tension={0.2}/></Group>)}</Group>;
  }
  if (theme === 'desert') {
    return <Group><Line points={[0,100,200,120,500,90,800,110]} stroke="#eab308" strokeWidth={1.5} tension={0.5} opacity={0.15}/><Line points={[0,280,300,260,600,290,800,270]} stroke="#eab308" strokeWidth={1.5} tension={0.5} opacity={0.15}/><Line points={[0,450,150,470,450,430,800,460]} stroke="#eab308" strokeWidth={1.5} tension={0.5} opacity={0.15}/></Group>;
  }
  if (theme === 'ocean') {
    return <Group><Path data="M 50 150 Q 60 145 70 150 Q 80 145 90 150" stroke="#bae6fd" strokeWidth={1.5} opacity={0.4}/><Path data="M 350 80 Q 360 75 370 80 Q 380 75 390 80" stroke="#bae6fd" strokeWidth={1.5} opacity={0.4}/><Path data="M 200 400 Q 210 395 220 400 Q 230 395 240 400" stroke="#bae6fd" strokeWidth={1.5} opacity={0.4}/><Path data="M 600 250 Q 610 245 620 250 Q 630 245 640 250" stroke="#bae6fd" strokeWidth={1.5} opacity={0.4}/></Group>;
  }
  return null;
};

// ── Main component ────────────────────────────────────────────────────────────
export default function CanvasEditor2D({
  shapes, setShapes, selectedId, setSelectedId,
  stageRef, showGrid = true, theme = 'dark',
  mapTheme: externalMapTheme, setMapTheme: externalSetMapTheme,
  hideLocalControls = false,
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions]   = useState({ width: 800, height: 600 });
  const [stageConfig, setStageConfig] = useState({ scale: 1, x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid]   = useState(showGrid);

  // Connector / overlay state
  const [hoveredShapeId, setHoveredShapeId]       = useState(null);
  const [isDraggingEndpoint, setIsDraggingEndpoint] = useState(false);
  const [guides, setGuides]                         = useState([]);        // alignment guides
  const [drawingConn, setDrawingConn]               = useState(null);      // { x1,y1,startBinding }
  const [connPreview, setConnPreview]               = useState(null);      // { x,y,snap }
  const snapIndicatorRef = useRef(null);

  // Drawing tools
  const [drawMode, setDrawMode]       = useState('select');
  const [drawColor, setDrawColor]     = useState('#ef4444');
  const [brushSize, setBrushSize]     = useState('md');
  const [isDrawing, setIsDrawing]     = useState(false);
  const [isShapesMenuOpen, setIsShapesMenuOpen] = useState(false);

  const [localMapTheme, setLocalMapTheme] = useState('paper');
  const mapTheme  = externalMapTheme  !== undefined ? externalMapTheme  : localMapTheme;
  const setMapTheme = externalSetMapTheme !== undefined ? externalSetMapTheme : setLocalMapTheme;

  // ── Sync relative-endpoint bindings when target shapes move ─────────────────
  useEffect(() => {
    const RELATIVE = new Set(['dottedLineArrow', 'elbowArrow', 'bezierArrow']);
    const updates = [];
    shapes.forEach(shape => {
      if (!RELATIVE.has(shape.type)) return;
      const sx = shape.x ?? 0, sy = shape.y ?? 0;
      const absEndX = sx + (shape.endX ?? 150);
      const absEndY = sy + (shape.endY ?? 0);
      if (shape.endBinding) {
        const r = resolveEndpoint(shape.endBinding, absEndX, absEndY, shapes);
        const newEndX = r.x - sx, newEndY = r.y - sy;
        if (Math.abs(newEndX - (shape.endX ?? 150)) > 0.5 || Math.abs(newEndY - (shape.endY ?? 0)) > 0.5)
          updates.push({ id: shape.id, endX: newEndX, endY: newEndY });
      }
      if (shape.startBinding) {
        const r = resolveEndpoint(shape.startBinding, sx, sy, shapes);
        if (Math.abs(r.x - sx) > 0.5 || Math.abs(r.y - sy) > 0.5)
          updates.push({ id: shape.id, x: r.x, y: r.y, endX: absEndX - r.x, endY: absEndY - r.y });
      }
    });
    if (updates.length > 0)
      setShapes(prev => prev.map(s => { const u = updates.find(u => u.id === s.id); return u ? { ...s, ...u } : s; }));
  }, [shapes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resize observer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setDimensions({ width: e.contentRect.width, height: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Stage helpers ────────────────────────────────────────────────────────────
  const handleWheel = e => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const ptr = stage.getPointerPosition();
    if (!ptr) return;
    const mp = { x: (ptr.x - stage.x()) / oldScale, y: (ptr.y - stage.y()) / oldScale };
    const newScale = Math.max(0.1, Math.min(e.evt.deltaY < 0 ? oldScale * 1.05 : oldScale / 1.05, 10));
    setStageConfig({ scale: newScale, x: ptr.x - mp.x * newScale, y: ptr.y - mp.y * newScale });
  };

  const stageToLocal = e => {
    const stage = e.target.getStage();
    const pos   = stage.getPointerPosition();
    return { x: (pos.x - stageConfig.x) / stageConfig.scale, y: (pos.y - stageConfig.y) / stageConfig.scale };
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const updateShape = (id, props, skip = false) =>
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...props } : s), skip);

  const deleteShape = id => {
    setShapes(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const bringForward = id => setShapes(prev => {
    const i = prev.findIndex(s => s.id === id);
    if (i < 0 || i === prev.length - 1) return prev;
    const a = [...prev]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a;
  });
  const sendBackward = id => setShapes(prev => {
    const i = prev.findIndex(s => s.id === id);
    if (i <= 0) return prev;
    const a = [...prev]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a;
  });

  const stampShape = (type, overrideProps = {}) => {
    const cx = -stageConfig.x / stageConfig.scale + dimensions.width  / 2 / stageConfig.scale;
    const cy = -stageConfig.y / stageConfig.scale + dimensions.height / 2 / stageConfig.scale;
    const base = ObjectRegistry[type]?.defaultProps || {};
    const id   = `${type}-${Date.now()}`;
    const posProps = CONNECTOR_TYPES.has(type)
      ? { x1: cx - 80, y1: cy, x2: cx + 80, y2: cy }
      : { x: cx, y: cy };
    setShapes(prev => [...prev, { ...base, ...overrideProps, id, type, ...posProps }]);
    setSelectedId(id);
    setDrawMode('select');
    setIsShapesMenuOpen(false);
  };

  // ── Connector draw-tool handlers ─────────────────────────────────────────────
  const handleStageMouseDown = e => {
    if (drawMode === 'connector') {
      const pos  = stageToLocal(e);
      const snap = findNearestConnectionPoint(pos, shapes);

      if (!drawingConn) {
        // Start drawing
        setDrawingConn({ x1: snap?.x ?? pos.x, y1: snap?.y ?? pos.y, startBinding: snap ? { shapeId: snap.shapeId, pointIndex: snap.pointIndex } : null });
      } else {
        // Commit connector
        const endX = connPreview?.snap?.x ?? connPreview?.x ?? pos.x;
        const endY = connPreview?.snap?.y ?? connPreview?.y ?? pos.y;
        const endBinding = connPreview?.snap ? { shapeId: connPreview.snap.shapeId, pointIndex: connPreview.snap.pointIndex } : null;
        const id = `orthoConnector-${Date.now()}`;
        setShapes(prev => [...prev, {
          id, type: 'orthoConnector',
          x1: drawingConn.x1, y1: drawingConn.y1, x2: endX, y2: endY,
          startBinding: drawingConn.startBinding, endBinding,
          waypoints: [], stroke: '#64748b', strokeWidth: 2,
          startArrow: 'none', endArrow: 'filled', dash: false,
        }]);
        setSelectedId(id);
        setDrawingConn(null);
        setConnPreview(null);
        setDrawMode('select');
      }
      return;
    }

    if (drawMode === 'select' || drawMode === 'eraser') {
      if (e.target === e.target.getStage() && drawMode === 'select') setSelectedId(null);
      return;
    }

    // Freehand / rect / ellipse drawing
    setIsDrawing(true);
    const pos = stageToLocal(e);
    const sw  = brushSize === 'sm' ? 2 : brushSize === 'lg' ? 8 : 4;
    const hw  = brushSize === 'sm' ? 10 : brushSize === 'lg' ? 30 : 18;
    let shape = { id: `draw-${Date.now()}`, x: pos.x, y: pos.y, rotation: 0 };
    if (drawMode === 'pen' || drawMode === 'highlighter') {
      shape = { ...shape, type: 'freehand', points: [0,0,0,0], stroke: drawColor, strokeWidth: drawMode === 'highlighter' ? hw : sw, opacity: drawMode === 'highlighter' ? 0.4 : 1, tension: 0.5 };
    } else if (drawMode === 'line') {
      shape = { ...shape, type: 'freehand', points: [0,0,0,0], stroke: drawColor, strokeWidth: sw, opacity: 1, tension: 0 };
    } else if (drawMode === 'rect') {
      shape = { ...shape, type: 'drawRect', width: 0, height: 0, stroke: drawColor, strokeWidth: sw };
    } else if (drawMode === 'ellipse') {
      shape = { ...shape, type: 'drawEllipse', radiusX: 0, radiusY: 0, stroke: drawColor, strokeWidth: sw };
    }
    setShapes(prev => [...prev, shape]);
  };

  const handleStageMouseMove = e => {
    const pos = stageToLocal(e);

    if (drawMode === 'connector') {
      const snap = findNearestConnectionPoint(pos, shapes);
      setConnPreview({ x: pos.x, y: pos.y, snap: snap ?? null });
      // Imperatively update snap indicator
      if (snapIndicatorRef.current) {
        if (snap) {
          snapIndicatorRef.current.x(snap.x); snapIndicatorRef.current.y(snap.y);
          snapIndicatorRef.current.visible(true);
        } else {
          snapIndicatorRef.current.visible(false);
        }
        snapIndicatorRef.current.getLayer()?.batchDraw();
      }
      return;
    }

    if (!isDrawing || drawMode === 'select') return;
    setShapes(prev => {
      const shapes = [...prev];
      const last   = { ...shapes[shapes.length - 1] };
      if (drawMode === 'pen' || drawMode === 'highlighter') {
        last.points = last.points.concat([pos.x - last.x, pos.y - last.y]);
      } else if (drawMode === 'line') {
        last.points = [0, 0, pos.x - last.x, pos.y - last.y];
      } else if (drawMode === 'rect') {
        last.width = pos.x - last.x; last.height = pos.y - last.y;
      } else if (drawMode === 'ellipse') {
        last.radiusX = Math.abs(pos.x - last.x); last.radiusY = Math.abs(pos.y - last.y);
      }
      shapes[shapes.length - 1] = last;
      return shapes;
    }, true);
  };

  const handleStageMouseUp = () => {
    if (isDrawing) { setIsDrawing(false); setShapes(s => [...s]); }
  };

  const handleKeyDown = e => {
    if (e.key === 'Escape') { setDrawingConn(null); setConnPreview(null); if (drawMode === 'connector') setDrawMode('select'); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) deleteShape(selectedId);
  };

  // ── Theme ────────────────────────────────────────────────────────────────────
  const themes = {
    dark:       { bgColor: '#0f172a', gridColor: '#1e293b' },
    paper:      { bgColor: '#fcfaf7', gridColor: '#f1ebd9' },
    parchment:  { bgColor: '#f4ebd0', gridColor: '#e3d5b5' },
    topography: { bgColor: '#faf8f2', gridColor: '#ece3ce' },
    grassland:  { bgColor: '#f0fdf4', gridColor: '#dcfce7' },
    desert:     { bgColor: '#fffbeb', gridColor: '#fef3c7' },
    ocean:      { bgColor: '#f0f9ff', gridColor: '#e0f2fe' },
    blueprint:  { bgColor: '#0b1d3a', gridColor: '#1e3a6a' },
  };
  const currentTheme = themes[mapTheme] || themes.paper;
  const bgSize = `${GRID_SIZE * stageConfig.scale}px ${GRID_SIZE * stageConfig.scale}px`;
  const bgPos  = `${stageConfig.x}px ${stageConfig.y}px`;

  // ── Selected shape info ───────────────────────────────────────────────────────
  const selectedShape = shapes.find(s => s.id === selectedId);

  // ── Connector rendering helper ───────────────────────────────────────────────
  const renderConnector = conn => {
    const isOrtho = conn.type === 'orthoConnector';
    const start   = resolveEndpoint(conn.startBinding, conn.x1 ?? conn.x ?? 0, conn.y1 ?? conn.y ?? 0, shapes);
    const end     = resolveEndpoint(conn.endBinding,   conn.x2 ?? (conn.x ?? 0) + 150, conn.y2 ?? conn.y ?? 0, shapes);
    const isSel   = conn.id === selectedId;
    const color   = isSel ? '#3b82f6' : (conn.stroke || '#64748b');
    const sw      = conn.strokeWidth || 2;

    let pts;
    if (isOrtho) {
      pts = computeOrthoPath(start, end, conn.waypoints || []);
    } else {
      pts = [start.x, start.y, end.x, end.y];
    }

    // End direction angle (for arrowhead)
    const n = pts.length;
    const endAngle   = Math.atan2(pts[n-1] - pts[n-3], pts[n-2] - pts[n-4]);
    const startAngle = Math.atan2(pts[1] - pts[3], pts[0] - pts[2]);

    const startArrow = conn.startArrow || 'none';
    const endArrow   = conn.endArrow   ?? (isOrtho ? 'filled' : (conn.pointerAtEnd !== false ? 'filled' : 'none'));

    // Shorten line so it doesn't overlap arrowhead
    const shortenEnd   = endArrow   !== 'none' ? 10 : 0;
    const shortenStart = startArrow !== 'none' ? 10 : 0;

    // Adjusted first/last points
    const ae = endAngle, as2 = startAngle;
    const adjPts = [...pts];
    if (shortenEnd > 0) {
      adjPts[n-2] = pts[n-2] - Math.cos(ae) * shortenEnd;
      adjPts[n-1] = pts[n-1] - Math.sin(ae) * shortenEnd;
    }
    if (shortenStart > 0) {
      adjPts[0] = pts[0] - Math.cos(as2) * shortenStart;
      adjPts[1] = pts[1] - Math.sin(as2) * shortenStart;
    }

    return (
      <React.Fragment key={conn.id}>
        <Line
          points={adjPts}
          stroke={color}
          strokeWidth={sw}
          dash={conn.dash ? [8, 4] : undefined}
          hitStrokeWidth={16}
          listening={drawMode === 'select' || drawMode === 'eraser'}
          onClick={() => {
            if (drawMode === 'select') { setSelectedId(conn.id); setHoveredShapeId(null); }
            if (drawMode === 'eraser') deleteShape(conn.id);
          }}
          onTap={() => drawMode === 'select' && setSelectedId(conn.id)}
        />
        <ArrowHead x={end.x}   y={end.y}   angle={endAngle}   style={endArrow}   color={color} />
        <ArrowHead x={start.x} y={start.y} angle={startAngle} style={startArrow} color={color} />
      </React.Fragment>
    );
  };

  // ── Endpoint handle factory ───────────────────────────────────────────────────
  const makeEndpointHandles = () => {
    if (!selectedId || drawMode !== 'select') return null;
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape || !ENDPOINT_EDITABLE.has(shape.type)) return null;

    let start, end, onStartCommit, onEndCommit;

    if (CONNECTOR_TYPES.has(shape.type)) {
      start = resolveEndpoint(shape.startBinding, shape.x1 ?? shape.x ?? 0, shape.y1 ?? shape.y ?? 0, shapes);
      end   = resolveEndpoint(shape.endBinding,   shape.x2 ?? (shape.x ?? 0) + 150, shape.y2 ?? shape.y ?? 0, shapes);
      onStartCommit = (p, snap) => {
        const binding = snap ? { shapeId: snap.shapeId, pointIndex: snap.pointIndex } : null;
        updateShape(shape.id, { x1: snap?.x ?? p.x, y1: snap?.y ?? p.y, startBinding: binding, waypoints: [] });
      };
      onEndCommit = (p, snap) => {
        const binding = snap ? { shapeId: snap.shapeId, pointIndex: snap.pointIndex } : null;
        updateShape(shape.id, { x2: snap?.x ?? p.x, y2: snap?.y ?? p.y, endBinding: binding, waypoints: [] });
      };
    } else {
      // Relative-endpoint types
      const sx = shape.x ?? 0, sy = shape.y ?? 0;
      const absEndX = sx + (shape.endX ?? 150);
      const absEndY = sy + (shape.endY ?? 0);
      start = resolveEndpoint(shape.startBinding ?? null, sx, sy, shapes);
      end   = resolveEndpoint(shape.endBinding   ?? null, absEndX, absEndY, shapes);
      onStartCommit = (p, snap) => {
        const fx = snap?.x ?? p.x, fy = snap?.y ?? p.y;
        const binding = snap ? { shapeId: snap.shapeId, pointIndex: snap.pointIndex } : null;
        updateShape(shape.id, { x: fx, y: fy, endX: absEndX - fx, endY: absEndY - fy, startBinding: binding });
      };
      onEndCommit = (p, snap) => {
        const fx = snap?.x ?? p.x, fy = snap?.y ?? p.y;
        const binding = snap ? { shapeId: snap.shapeId, pointIndex: snap.pointIndex } : null;
        updateShape(shape.id, { endX: fx - sx, endY: fy - sy, endBinding: binding });
      };
    }

    const makeHandle = (pos, endKey, onCommit) => (
      <Circle
        key={`ep-${shape.id}-${endKey}`}
        x={pos.x} y={pos.y}
        radius={7}
        fill={endKey === 'start' ? '#10b981' : '#f59e0b'}
        stroke="#ffffff" strokeWidth={2.5}
        draggable
        onDragStart={() => { setIsDraggingEndpoint(true); setHoveredShapeId(null); }}
        onDragMove={e => {
          const p = { x: e.target.x(), y: e.target.y() };
          const snap = findNearestConnectionPoint(p, shapes, shape.id);
          if (snap) {
            e.target.x(snap.x); e.target.y(snap.y);
            if (snapIndicatorRef.current) { snapIndicatorRef.current.x(snap.x); snapIndicatorRef.current.y(snap.y); snapIndicatorRef.current.visible(true); snapIndicatorRef.current.getLayer()?.batchDraw(); }
          } else if (snapIndicatorRef.current) { snapIndicatorRef.current.visible(false); snapIndicatorRef.current.getLayer()?.batchDraw(); }
        }}
        onDragEnd={e => {
          setIsDraggingEndpoint(false);
          if (snapIndicatorRef.current) snapIndicatorRef.current.visible(false);
          const p = { x: e.target.x(), y: e.target.y() };
          onCommit(p, findNearestConnectionPoint(p, shapes, shape.id) ?? null);
        }}
      />
    );

    return [makeHandle(start, 'start', onStartCommit), makeHandle(end, 'end', onEndCommit)];
  };

  // ── orthoConnector pivot handles ─────────────────────────────────────────────
  const makePivotHandles = () => {
    if (!selectedId || drawMode !== 'select') return null;
    const conn = shapes.find(s => s.id === selectedId && s.type === 'orthoConnector');
    if (!conn) return null;
    const start = resolveEndpoint(conn.startBinding, conn.x1 ?? 0, conn.y1 ?? 0, shapes);
    const end   = resolveEndpoint(conn.endBinding,   conn.x2 ?? 150, conn.y2 ?? 0, shapes);
    const pts   = computeOrthoPath(start, end, conn.waypoints || []);
    const mids  = getSegmentMidpoints(pts);

    return mids.map((mid, mi) => (
      <Circle
        key={`pv-${conn.id}-${mi}`}
        x={mid.x} y={mid.y}
        radius={5}
        fill="#ffffff" stroke="#3b82f6" strokeWidth={2}
        draggable
        dragBoundFunc={pos => {
          // Constrain to the perpendicular axis of this segment
          const stage = stageRef.current;
          if (!stage) return pos;
          const lp = stage.getAbsoluteTransform().copy().invert().point(pos);
          return stage.getAbsoluteTransform().point(
            mid.isHorizontal
              ? { x: mid.x, y: lp.y }   // horizontal seg → drag vertically only
              : { x: lp.x, y: mid.y }   // vertical seg  → drag horizontally only
          );
        }}
        onDragEnd={e => {
          const nx = e.target.x(), ny = e.target.y();
          const newPts = [...pts];
          const si = mid.segIndex;
          if (mid.isHorizontal) {
            // Adjust Y of both pts in this segment
            newPts[si*2+1] = ny; newPts[si*2+3] = ny;
          } else {
            newPts[si*2] = nx; newPts[si*2+2] = nx;
          }
          // Store intermediate points as waypoints (exclude first and last)
          const wps = [];
          for (let i = 2; i < newPts.length - 2; i += 2) wps.push({ x: newPts[i], y: newPts[i+1] });
          updateShape(conn.id, { waypoints: wps });
        }}
      />
    ));
  };

  // ── Connector preview line while drawing ─────────────────────────────────────
  const renderConnectorPreview = () => {
    if (!drawingConn || !connPreview) return null;
    const start = { x: drawingConn.x1, y: drawingConn.y1 };
    const end   = { x: connPreview.snap?.x ?? connPreview.x, y: connPreview.snap?.y ?? connPreview.y };
    const pts   = computeOrthoPath(start, end);
    return <Line points={pts} stroke="#3b82f6" strokeWidth={2} dash={[6, 4]} opacity={0.7} listening={false} />;
  };

  // ── Connection point + symbols ───────────────────────────────────────────────
  const renderConnectionAnchors = () => {
    const showAll  = drawMode === 'connector' || isDraggingEndpoint;
    const shapesToShow = showAll
      ? shapes.filter(s => !CONNECTOR_TYPES.has(s.type) && s.type !== 'freehand')
      : hoveredShapeId
        ? [shapes.find(s => s.id === hoveredShapeId)].filter(Boolean)
        : [];

    return shapesToShow.flatMap(shape =>
      getConnectionPoints(shape).map((pt, i) => {
        const isSnapped = connPreview?.snap?.shapeId === shape.id && connPreview?.snap?.pointIndex === i;
        return (
          <Group key={`cp-${shape.id}-${i}`} x={pt.x} y={pt.y} listening={false}>
            {isSnapped
              ? <Circle radius={8} fill="rgba(16,185,129,0.25)" stroke="#10b981" strokeWidth={2} />
              : <> <Line points={[-5,0,5,0]} stroke="#3b82f6" strokeWidth={1.5} opacity={0.8} /> <Line points={[0,-5,0,5]} stroke="#3b82f6" strokeWidth={1.5} opacity={0.8} /> </>
            }
          </Group>
        );
      })
    );
  };

  // ── Alignment guides ─────────────────────────────────────────────────────────
  const renderGuides = () =>
    guides.map((g, i) =>
      g.axis === 'h'
        ? <Line key={`g-${i}`} points={[-5000, g.pos, 5000, g.pos]} stroke="#10b981" strokeWidth={1} dash={[6,4]} opacity={0.85} listening={false} />
        : <Line key={`g-${i}`} points={[g.pos, -5000, g.pos, 5000]} stroke="#10b981" strokeWidth={1} dash={[6,4]} opacity={0.85} listening={false} />
    );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        width: '100%', height: '100%', outline: 'none',
        cursor: drawMode === 'connector' ? 'crosshair' : 'default',
        backgroundColor: currentTheme.bgColor,
        backgroundImage: showGrid ? `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)` : 'none',
        backgroundSize: bgSize, backgroundPosition: bgPos,
      }}
    >
      {/* ── Controls overlay ── */}
      {!hideLocalControls && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#fff', userSelect: 'none' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
            <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} />
            Snap to Grid (20px)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <span>Theme:</span>
            <select value={mapTheme} onChange={e => setMapTheme(e.target.value)} style={{ background: '#334155', border: 'none', color: 'white', borderRadius: '4px', padding: '4px' }}>
              {['dark','paper','parchment','topography','grassland','desert','ocean','blueprint'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </label>
        </div>
      )}

      {/* ── Selected shape X/Y + z-order controls ── */}
      {selectedShape && !CONNECTOR_TYPES.has(selectedShape.type) && drawMode === 'select' && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(15,23,42,0.92)', border: '1px solid #334155', borderRadius: '10px', padding: '7px 14px', display: 'flex', gap: '14px', alignItems: 'center', color: '#e2e8f0', fontSize: '12px', userSelect: 'none' }}>
          <span style={{ color: '#64748b' }}>X</span>
          <input
            type="number"
            value={Math.round(selectedShape.x ?? 0)}
            onChange={e => updateShape(selectedShape.id, { x: +e.target.value })}
            style={{ width: '56px', background: '#1e293b', border: '1px solid #334155', borderRadius: '5px', color: '#e2e8f0', padding: '3px 6px', fontSize: '12px', textAlign: 'right' }}
          />
          <span style={{ color: '#64748b' }}>Y</span>
          <input
            type="number"
            value={Math.round(selectedShape.y ?? 0)}
            onChange={e => updateShape(selectedShape.id, { y: +e.target.value })}
            style={{ width: '56px', background: '#1e293b', border: '1px solid #334155', borderRadius: '5px', color: '#e2e8f0', padding: '3px 6px', fontSize: '12px', textAlign: 'right' }}
          />
          <div style={{ width: '1px', height: '18px', background: '#334155' }} />
          <button onClick={() => bringForward(selectedId)} title="Bring Forward" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}><ChevronUp size={15} /></button>
          <button onClick={() => sendBackward(selectedId)} title="Send Backward" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}><ChevronDown size={15} /></button>
          <div style={{ width: '1px', height: '18px', background: '#334155' }} />
          <button onClick={() => deleteShape(selectedId)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>Delete</button>
        </div>
      )}

      {/* ── Connector status bar ── */}
      {drawMode === 'connector' && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid #3b82f6', borderRadius: '8px', padding: '6px 16px', color: '#93c5fd', fontSize: '12px', fontWeight: 600 }}>
          {drawingConn ? 'Click a shape anchor to complete the connector — ESC to cancel' : 'Click a shape anchor or anywhere to start drawing a connector'}
        </div>
      )}

      {/* ── Drawing Toolbar ── */}
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: '#1e293b', padding: '8px', borderRadius: '30px', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,.5)', border: '1px solid #334155' }}>
        {[
          { id: 'select',    icon: <MousePointer2 size={16} />, title: 'Select & Move' },
          { id: 'connector', icon: <Workflow size={16} />,       title: 'Connector (orthogonal)' },
          { id: 'pen',       icon: <Pen size={16} />,           title: 'Pen' },
          { id: 'highlighter',icon: <Highlighter size={16} />,  title: 'Highlighter' },
          { id: 'eraser',    icon: <Eraser size={16} />,        title: 'Eraser' },
          { id: 'line',      icon: <Minus size={16} />,         title: 'Line' },
          { id: 'rect',      icon: <SquareIcon size={16} />,    title: 'Rectangle' },
          { id: 'ellipse',   icon: <CircleIcon size={16} />,    title: 'Ellipse' },
        ].map(t => (
          <button key={t.id} onClick={() => { setDrawMode(t.id); setSelectedId(null); setIsShapesMenuOpen(false); setDrawingConn(null); setConnPreview(null); }} title={t.title}
            style={{ width: 36, height: 36, borderRadius: 18, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: drawMode === t.id ? '#3b82f6' : 'transparent', color: drawMode === t.id ? '#fff' : '#94a3b8' }}>
            {t.icon}
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: '#334155' }} />

        {/* Quick shapes */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setIsShapesMenuOpen(o => !o)} title="Quick Shapes"
            style={{ width: 36, height: 36, borderRadius: 18, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isShapesMenuOpen ? '#3b82f6' : 'transparent', color: isShapesMenuOpen ? '#fff' : '#94a3b8' }}>
            <Shapes size={16} />
          </button>
          {isShapesMenuOpen && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 10, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 10px 25px -5px rgba(0,0,0,.5)', zIndex: 20 }}>
              {[
                { type: 'triangle',       icon: <Triangle size={16} />,   label: 'Triangle' },
                { type: 'polygon', overrides: { sides: 5 }, icon: <Star size={16} />, label: 'Pentagon' },
                { type: 'polygon', overrides: { sides: 6 }, icon: <Hexagon size={16} />, label: 'Hexagon' },
                { type: 'orthoConnector', icon: <Workflow size={16} />,   label: 'Ortho Connector' },
                { type: 'connectorArrow', icon: <ArrowRight size={16} />, label: 'Straight Arrow' },
                { type: 'point',          icon: <CircleIcon size={16} fill="currentColor" />, label: 'Point' },
              ].map(s => (
                <button key={s.label} onClick={() => stampShape(s.type, s.overrides || {})}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: '#cbd5e1', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: '#334155' }} />

        {/* Brush size */}
        {['sm','md','lg'].map((sz, i) => (
          <button key={sz} onClick={() => setBrushSize(sz)} title={sz}
            style={{ width: 24, height: 24, borderRadius: 4, border: 'none', cursor: 'pointer', background: brushSize === sz ? '#334155' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: (i+1)*3+2, height: (i+1)*3+2, borderRadius: '50%', background: brushSize === sz ? '#fff' : '#94a3b8' }} />
          </button>
        ))}

        <div style={{ width: 1, height: 24, background: '#334155' }} />

        {/* Colors */}
        {['#ef4444','#3b82f6','#22c55e','#eab308','#000000','#ffffff'].map(col => (
          <button key={col} onClick={() => setDrawColor(col)} title={col}
            style={{ width: 24, height: 24, borderRadius: 12, border: drawColor === col ? '2px solid white' : '1px solid #334155', cursor: 'pointer', background: col, transform: drawColor === col ? 'scale(1.1)' : 'scale(1)' }} />
        ))}
      </div>

      {/* ── Konva Stage ── */}
      <Stage
        width={dimensions.width} height={dimensions.height}
        onMouseDown={handleStageMouseDown} onTouchStart={handleStageMouseDown}
        onMouseMove={handleStageMouseMove} onTouchMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}     onTouchEnd={handleStageMouseUp}
        onWheel={handleWheel}
        draggable={drawMode === 'select'}
        onDragEnd={e => { if (e.target === stageRef.current) setStageConfig(p => ({ ...p, x: e.target.x(), y: e.target.y() })); }}
        scaleX={stageConfig.scale} scaleY={stageConfig.scale}
        x={stageConfig.x} y={stageConfig.y}
        ref={stageRef}
      >
        <Layer>
          <BackgroundDecorations theme={mapTheme} />

          {/* ── Regular shapes (non-connector) ── */}
          {shapes.filter(s => !CONNECTOR_TYPES.has(s.type)).map(shape => (
            <ShapeElement
              key={shape.id}
              shapeProps={shape}
              isSelected={shape.id === selectedId}
              onSelect={() => setSelectedId(shape.id)}
              onDelete={() => deleteShape(shape.id)}
              onChange={(p, skip) => updateShape(shape.id, p, skip)}
              snapToGrid={snapToGrid}
              allShapes={shapes}
              drawMode={drawMode}
              onHoverChange={(drawMode === 'select' || drawMode === 'connector') ? setHoveredShapeId : undefined}
              onDragGuide={gs => setGuides(gs)}
              onDragEnd={() => setGuides([])}
            />
          ))}

          {/* ── Connector shapes ── */}
          {shapes.filter(s => CONNECTOR_TYPES.has(s.type)).map(renderConnector)}

          {/* ── Connector draw preview ── */}
          {renderConnectorPreview()}

          {/* ── Connection point anchors ── */}
          {renderConnectionAnchors()}

          {/* ── Snap-target ring (imperatively updated) ── */}
          <Circle ref={snapIndicatorRef} x={0} y={0} radius={12} fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth={2.5} visible={false} listening={false} />

          {/* ── Alignment guides ── */}
          {renderGuides()}

          {/* ── Endpoint handles ── */}
          {makeEndpointHandles()}

          {/* ── Pivot handles for selected orthoConnector ── */}
          {makePivotHandles()}
        </Layer>
      </Stage>
    </div>
  );
}
