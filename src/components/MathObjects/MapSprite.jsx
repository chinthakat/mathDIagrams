import React from 'react';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

export default function MapSprite({ shape, isSelected, onSelect }) {
  // Assume the images are located in the public or assets path relative to the app
  // In a Vite app with assets imported, we would import them or put them in public.
  // Here we'll rely on an import mapping or standard public path.
  // Actually, since it's an asset, we'll try to load it dynamically.
  
  // We can construct the path. In Vite, if the image is in src/assets/maps/
  // it might be tricky to dynamically require without a glob import.
  // Let's use a standard URL approach for simplicity, assuming they will be served or bundled correctly.
  // A safer approach in Vite for dynamic images is putting them in the 'public/maps/' folder.
  // However, since we placed them in src/assets/maps/, we can use a hardcoded dynamic import pattern or just standard relative paths if they get resolved.
  
  // For now, we use a vite specific glob import trick or just the URL.
  // Given we just dumped them in src/assets/maps, let's use standard image loading.
  // Actually, the easiest way to ensure it loads in dev is using the /src/assets/maps path directly.
  
  const [image, status] = useImage(`/src/assets/maps/${shape.spriteName}.png`);

  if (!image) {
    return null;
  }

  return (
    <KonvaImage
      x={0}
      y={0}
      width={shape.width || 64}
      height={shape.height || 64}
      image={image}
      rotation={shape.rotation || 0}
      stroke={isSelected ? '#3b82f6' : null}
      strokeWidth={isSelected ? 2 : 0}
      offsetX={(shape.width || 64) / 2}
      offsetY={(shape.height || 64) / 2}
    />
  );
}
