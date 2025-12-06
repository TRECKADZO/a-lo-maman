import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { LightLoader } from './LightCard';

// HOC pour lazy loading de composants
export function lazyLoad(importFn, fallback = null) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props) {
    return (
      <Suspense fallback={fallback || <LightLoader />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Composant qui charge uniquement quand visible
export function LazyVisible({ children, fallback = null, rootMargin = '100px' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <div className="h-20" />)}
    </div>
  );
}

// Liste virtualisée légère
export function VirtualList({ 
  items, 
  renderItem, 
  itemHeight = 60, 
  overscan = 3,
  className = ''
}) {
  const containerRef = useRef();
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => setScrollTop(container.scrollTop);
    const handleResize = () => setContainerHeight(container.clientHeight);

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div 
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Prefetch de données
export function usePrefetch(queries = []) {
  useEffect(() => {
    // Attendre que la page soit idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        queries.forEach(async ({ key, fn }) => {
          try {
            const cached = localStorage.getItem(`alo_cache_${key}`);
            if (!cached) {
              const data = await fn();
              localStorage.setItem(`alo_cache_${key}`, JSON.stringify({
                data,
                timestamp: Date.now(),
                expires: Date.now() + 1000 * 60 * 60
              }));
            }
          } catch (e) {}
        });
      });
    }
  }, []);
}