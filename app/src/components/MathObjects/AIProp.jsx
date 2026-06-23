import React, { useState, useEffect } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';

export default function AIProp({ width = 100, height = 100, svgContent }) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!svgContent) {
      setImage(null);
      return;
    }

    try {
      let safeSvg = svgContent;
      if (!safeSvg.includes('xmlns=')) {
        safeSvg = safeSvg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      }

      const encoded = encodeURIComponent(safeSvg);
      const url = `data:image/svg+xml;utf8,${encoded}`;

      const img = new window.Image();
      img.onload = () => {
        setImage(img);
      };
      img.onerror = () => {
        console.error("Failed to load SVG into Image element.");
      };
      img.src = url;

      return () => {};
    } catch (e) {
      console.error("Error parsing SVG:", e);
    }
  }, [svgContent]);

  return (
    <Group>
      {image ? (
        <KonvaImage
          image={image}
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
        />
      ) : (
        <Rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          fill="#cbd5e1"
          stroke="#475569"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}
    </Group>
  );
}
