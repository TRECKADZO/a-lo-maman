import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SwipeableTabsNav({ tabs, activeTab, onTabChange, children }) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const tabsRef = useRef(null);
  const contentRef = useRef(null);

  // Gestion du swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      let newIndex;

      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        newIndex = currentIndex + 1;
      } else if (isRightSwipe && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }

      if (newIndex !== undefined) {
        onTabChange(tabs[newIndex].id);
      }
    }
  };

  // Scroll automatique du tab actif en vue
  useEffect(() => {
    const activeElement = tabsRef.current?.querySelector('[data-active="true"]');
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div className="space-y-4">
      {/* Tabs avec scroll horizontal */}
      <div className="relative">
        {currentIndex > 0 && (
          <button 
            onClick={() => onTabChange(tabs[currentIndex - 1].id)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm p-1 rounded-r-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-8 md:px-0"
          style={{ scrollBehavior: 'smooth' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              data-active={tab.id === activeTab}
              onClick={() => onTabChange(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                tab.id === activeTab
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>

        {currentIndex < tabs.length - 1 && (
          <button 
            onClick={() => onTabChange(tabs[currentIndex + 1].id)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm p-1 rounded-l-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Contenu avec geste de swipe */}
      <div
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative touch-pan-y select-none"
      >
        {children}
      </div>

      {/* Indicateurs de swipe (mobile uniquement) */}
      <div className="flex justify-center gap-1 md:hidden">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`h-2 rounded-full transition-all ${
              tab.id === activeTab ? 'w-6 bg-pink-600' : 'w-2 bg-gray-300'
            }`}
            aria-label={`Aller à ${tab.label}`}
          />
        ))}
      </div>
    </div>
  );
}