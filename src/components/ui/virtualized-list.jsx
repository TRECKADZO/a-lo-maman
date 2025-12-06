import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * VirtualizedList - Liste virtualisée pour performances optimales
 * Rend uniquement les items visibles à l'écran
 */
export function VirtualizedList({
  data = [],
  renderItem,
  itemHeight = 100,
  overscan = 3,
  onEndReached,
  onEndReachedThreshold = 0.8,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  keyExtractor = (item, index) => index,
  className = '',
}) {
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculer les items visibles
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    data.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = data.slice(startIndex, endIndex);
  const totalHeight = data.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Observer le scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollTop: newScrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setScrollTop(newScrollTop);

    // Trigger onEndReached
    if (onEndReached) {
      const scrollPercentage = (newScrollTop + clientHeight) / scrollHeight;
      if (scrollPercentage >= onEndReachedThreshold) {
        onEndReached();
      }
    }
  }, [onEndReached, onEndReachedThreshold]);

  // Mesurer la hauteur du container
  useEffect(() => {
    if (!scrollRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setContainerHeight(entry.contentRect.height);
    });

    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, []);

  if (data.length === 0 && ListEmptyComponent) {
    return <div className={className}>{ListEmptyComponent}</div>;
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={`overflow-y-auto h-full ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {ListHeaderComponent}
      
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={keyExtractor(item, startIndex + index)}>
              {renderItem({ item, index: startIndex + index })}
            </div>
          ))}
        </div>
      </div>

      {ListFooterComponent}
    </div>
  );
}

/**
 * InfiniteScrollList - Liste avec infinite scroll
 */
export function InfiniteScrollList({
  data = [],
  renderItem,
  fetchMore,
  hasMore = true,
  loading = false,
  LoadingComponent,
  className = '',
}) {
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, fetchMore]);

  return (
    <div className={`overflow-y-auto h-full ${className}`}>
      <AnimatePresence mode="popLayout">
        {data.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {renderItem({ item, index })}
          </motion.div>
        ))}
      </AnimatePresence>

      {hasMore && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {loading && (LoadingComponent || (
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * SectionList - Liste avec sections (comme iOS)
 */
export function SectionList({
  sections = [],
  renderItem,
  renderSectionHeader,
  keyExtractor = (item, index) => index,
  className = '',
}) {
  return (
    <div className={`overflow-y-auto h-full ${className}`} style={{ WebkitOverflowScrolling: 'touch' }}>
      {sections.map((section, sectionIndex) => (
        <div key={section.key || sectionIndex}>
          {/* Section Header */}
          {renderSectionHeader && (
            <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800">
              {renderSectionHeader({ section })}
            </div>
          )}

          {/* Section Items */}
          {section.data.map((item, itemIndex) => (
            <div key={keyExtractor(item, itemIndex)}>
              {renderItem({ item, index: itemIndex, section })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SwipeableList - Liste avec actions swipe
 */
export function SwipeableList({
  data = [],
  renderItem,
  leftActions,
  rightActions,
  keyExtractor = (item, index) => index,
  className = '',
}) {
  const [swipedIndex, setSwipedIndex] = useState(null);

  return (
    <div className={`overflow-hidden ${className}`}>
      {data.map((item, index) => {
        const isOpen = swipedIndex === index;

        return (
          <motion.div
            key={keyExtractor(item, index)}
            className="relative overflow-hidden"
          >
            {/* Actions cachées */}
            {leftActions && (
              <div className="absolute left-0 top-0 bottom-0 flex items-center bg-red-500">
                {leftActions({ item, close: () => setSwipedIndex(null) })}
              </div>
            )}
            {rightActions && (
              <div className="absolute right-0 top-0 bottom-0 flex items-center bg-green-500">
                {rightActions({ item, close: () => setSwipedIndex(null) })}
              </div>
            )}

            {/* Item swipeable */}
            <motion.div
              drag="x"
              dragConstraints={{ left: -100, right: 100 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset }) => {
                if (Math.abs(offset.x) > 50) {
                  setSwipedIndex(index);
                } else {
                  setSwipedIndex(null);
                }
              }}
              animate={{ x: isOpen ? (offset.x > 0 ? 100 : -100) : 0 }}
              className="bg-white dark:bg-gray-900 relative z-10"
            >
              {renderItem({ item, index })}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * GridList - Grille responsive avec lazy loading
 */
export function GridList({
  data = [],
  renderItem,
  columns = 2,
  gap = 4,
  keyExtractor = (item, index) => index,
  className = '',
}) {
  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {data.map((item, index) => (
        <motion.div
          key={keyExtractor(item, index)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          {renderItem({ item, index })}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * CarouselList - Carousel horizontal natif
 */
export function CarouselList({
  data = [],
  renderItem,
  autoPlay = false,
  interval = 3000,
  showIndicators = true,
  keyExtractor = (item, index) => index,
  className = '',
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, data.length]);

  useEffect(() => {
    if (scrollRef.current) {
      const itemWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: currentIndex * itemWidth,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  return (
    <div className={`relative ${className}`}>
      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {data.map((item, index) => (
          <div
            key={keyExtractor(item, index)}
            className="flex-shrink-0 w-full snap-start"
          >
            {renderItem({ item, index })}
          </div>
        ))}
      </div>

      {/* Indicators */}
      {showIndicators && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {data.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default {
  VirtualizedList,
  InfiniteScrollList,
  SectionList,
  SwipeableList,
  GridList,
  CarouselList,
};