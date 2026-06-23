import React, { useState, useEffect } from 'react';
import { Image } from 'react-konva';
import { getSvgIconDataUrl } from '../../registry/iconRegistry';

export default function MathIcon({ url, iconName, color, width, height, rotation, opacity }) {
  const [image, setImage] = useState(null);

  useEffect(() => {
    let srcUrl = url;

    // Generate dynamic SVG data URL if no custom image URL is provided
    if (!srcUrl && iconName) {
      srcUrl = getSvgIconDataUrl(iconName, color || '#3b82f6');
    }

    if (!srcUrl) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    if (srcUrl && !srcUrl.startsWith('data:')) {
      img.crossOrigin = 'Anonymous';
    }
    img.src = srcUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [url, iconName, color]);

  return (
    <Image 
      image={image} 
      width={width} 
      height={height} 
      rotation={rotation} 
      opacity={opacity} 
    />
  );
}
