import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SwipeableTabs({ tabs, activeTab, onTabChange, children }) {
  const [direction, setDirection] = useState(0);
  const activeIndex = tabs.findIndex(t => t.value === activeTab);

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 50;
    
    if (info.offset.x > swipeThreshold && activeIndex > 0) {
      // Swipe right - go to previous tab
      setDirection(-1);
      onTabChange(tabs[activeIndex - 1].value);
    } else if (info.offset.x < -swipeThreshold && activeIndex < tabs.length - 1) {
      // Swipe left - go to next tab
      setDirection(1);
      onTabChange(tabs[activeIndex + 1].value);
    }
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="relative overflow-hidden">
      {/* Tab indicators */}
      <div className="flex justify-center gap-2 mb-4">
        {tabs.map((tab, index) => (
          <button
            key={tab.value}
            onClick={() => {
              setDirection(index > activeIndex ? 1 : -1);
              onTabChange(tab.value);
            }}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex 
                ? 'w-8 bg-pink-500' 
                : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Swipeable content */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={activeTab}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}