import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths } from 'date-fns';

export default function CalendrierSwipeable({ date, onDateChange, views, currentView, onViewChange, renderCalendar }) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const calendarRef = useRef(null);

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

    if (isLeftSwipe) {
      // Swipe gauche = mois suivant
      onDateChange(addMonths(date, 1));
    } else if (isRightSwipe) {
      // Swipe droit = mois précédent
      onDateChange(subMonths(date, 1));
    }
  };

  const currentViewIndex = views.findIndex(v => v.id === currentView);

  return (
    <div className="space-y-4">
      {/* Sélecteur de vue avec swipe */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide md:justify-center">
        {views.map((view, idx) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all ${
              currentView === view.id
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {view.icon && <span className="mr-2">{view.icon}</span>}
            {view.label}
          </button>
        ))}
      </div>

      {/* Calendrier avec geste de swipe */}
      <div
        ref={calendarRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative touch-pan-y select-none bg-white rounded-lg p-4"
      >
        {/* Flèches de navigation */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => onDateChange(subMonths(date, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h3 className="font-semibold text-center flex-1">
            {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </h3>

          <button
            onClick={() => onDateChange(addMonths(date, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu du calendrier */}
        {renderCalendar()}

        {/* Indicateur de swipe (mobile) */}
        <p className="text-xs text-center text-gray-400 mt-4 md:hidden">
          ← Glissez pour naviguer →
        </p>
      </div>
    </div>
  );
}