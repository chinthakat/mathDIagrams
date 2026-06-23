import React, { useState, useEffect } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';

export default function AITerrain({ width = 600, height = 400, svgContent }) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!svgContent) {
      setImage(null);
      return;
    }

    try {
      // Ensure the SVG has the correct namespace if missing
      let safeSvg = svgContent;
      if (!safeSvg.includes('xmlns=')) {
        safeSvg = safeSvg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      }

      // Encode as data URI
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

      return () => {
        // No revocation needed for data URIs
      };
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
          fill="#fef3c7"
          stroke="#d97706"
          strokeWidth={4}
          dash={[10, 10]}
        />
      )}
    </Group>
  );
}
