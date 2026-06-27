import React, { useState, useEffect } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';

/**
 * RasterImage — renders any raster src (PNG/JPEG/SVG data-URL or https URL)
 * as a Konva Image node. Centered on the group origin (x=0, y=0).
 *
 * props: src, width, height, opacity
 */
export default function RasterImage({ src, width = 300, height = 200, opacity = 1 }) {
  const [image, setImage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) { setImage(null); return; }
    setError(false);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  const w = width;
  const h = height;

  return (
    <Group>
      {image ? (
        <KonvaImage
          image={image}
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          opacity={opacity}
        />
      ) : error ? (
        <>
          <Rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#fef2f2" stroke="#fca5a5" strokeWidth={1} />
          <Text x={-w / 2} y={-10} width={w} text="Image failed to load" fontSize={11} fill="#ef4444" align="center" />
        </>
      ) : (
        <>
          <Rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} dash={[4, 4]} />
          <Text x={-w / 2} y={-8} width={w} text="Loading…" fontSize={11} fill="#94a3b8" align="center" />
        </>
      )}
    </Group>
  );
}
