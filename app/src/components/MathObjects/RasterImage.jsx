import React, { useState, useEffect } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import { CLIPART_ITEMS } from '../../assets/clipartLibrary';

function resolveClipartSrc(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  const clean = src.trim().toLowerCase();
  
  // 1. Try to find exact match by ID
  let match = CLIPART_ITEMS.find(item => item.id.toLowerCase() === clean);
  if (match) return match.url;

  // 2. Try to find exact match by label
  match = CLIPART_ITEMS.find(item => item.label.toLowerCase() === clean);
  if (match) return match.url;

  // 3. Try to find partial match on label
  match = CLIPART_ITEMS.find(item => item.label.toLowerCase().includes(clean) || clean.includes(item.label.toLowerCase()));
  if (match) return match.url;

  // 4. Try to find match by emoji
  match = CLIPART_ITEMS.find(item => item.emoji === src.trim());
  if (match) return match.url;

  return src;
}

/**
 * RasterImage — renders any raster src (PNG/JPEG/SVG data-URL or https URL)
 * as a Konva Image node. Centered on the group origin (x=0, y=0).
 *
 * props: src, width, height, opacity
 */
export default function RasterImage({ src, width = 300, height = 200, opacity = 1, flipX = false, flipY = false }) {
  const [image, setImage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const resolvedSrc = resolveClipartSrc(src);
    if (!resolvedSrc) { setImage(null); return; }
    setError(false);
    const img = new window.Image();
    // Only set crossOrigin for non-data URLs (data: URIs don't need it)
    if (!resolvedSrc.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => {
      // Retry without crossOrigin (some servers don't send CORS headers)
      if (!resolvedSrc.startsWith('data:') && img.crossOrigin) {
        const img2 = new window.Image();
        img2.onload = () => setImage(img2);
        img2.onerror = () => setError(true);
        img2.src = resolvedSrc;
      } else {
        setError(true);
      }
    };
    img.src = resolvedSrc;
  }, [src]);

  const w = width;
  const h = height;

  return (
    <Group scaleX={flipX ? -1 : 1} scaleY={flipY ? -1 : 1}>
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
