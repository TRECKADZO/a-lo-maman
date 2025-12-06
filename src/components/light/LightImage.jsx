import React, { useState, useEffect, useRef } from 'react';
import { useLightMode } from '../general/LightModeProvider';

// Image avec lazy loading et placeholder
export default function LightImage({ 
  src, 
  alt = '', 
  className = '', 
  placeholder = null,
  lowQualitySrc = null,
  width,
  height
}) {
  const { isLightMode } = useLightMode();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef();

  // Observer pour lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // En mode léger, utiliser version basse qualité ou placeholder
  const imageSrc = isLightMode && lowQualitySrc ? lowQualitySrc : src;

  // Placeholder par défaut
  const defaultPlaceholder = (
    <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{ width, height }}>
      <span className="text-gray-400 text-2xl">📷</span>
    </div>
  );

  if (error) {
    return placeholder || defaultPlaceholder;
  }

  return (
    <div ref={imgRef} className={`relative ${className}`} style={{ width, height }}>
      {/* Placeholder pendant chargement */}
      {!loaded && (placeholder || defaultPlaceholder)}
      
      {/* Image */}
      {inView && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
          className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          style={{ 
            width, 
            height,
            position: loaded ? 'relative' : 'absolute',
            top: 0,
            left: 0
          }}
        />
      )}
    </div>
  );
}

// Avatar léger avec initiales comme fallback
export function LightAvatar({ src, name = '', size = 'md', className = '' }) {
  const { isLightMode } = useLightMode();
  const [error, setError] = useState(false);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // En mode léger, toujours afficher les initiales
  if (isLightMode || !src || error) {
    return (
      <div className={`${sizes[size]} rounded-full bg-pink-100 text-pink-700 font-bold flex items-center justify-center ${className}`}>
        {initials || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      loading="lazy"
      className={`${sizes[size]} rounded-full object-cover ${className}`}
    />
  );
}