import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PatientCardSwipeable({ patients, currentIndex, onIndexChange, renderCard }) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const cardRef = useRef(null);

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

    if (isLeftSwipe && currentIndex < patients.length - 1) {
      onIndexChange(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  if (patients.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Aucun patient</p>
      </Card>
    );
  }

  const patient = patients[currentIndex];

  return (
    <div className="space-y-4">
      {/* Carte avec geste de swipe */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative touch-pan-y select-none"
      >
        <div className="flex items-center gap-2">
          {currentIndex > 0 && (
            <button
              onClick={() => onIndexChange(currentIndex - 1)}
              className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 z-10 md:flex hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex-1">
            {renderCard(patient)}
          </div>

          {currentIndex < patients.length - 1 && (
            <button
              onClick={() => onIndexChange(currentIndex + 1)}
              className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 z-10 md:flex hidden"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Indicateurs de swipe */}
      <div className="flex justify-center gap-1 flex-wrap">
        {patients.map((_, idx) => (
          <button
            key={idx}
            onClick={() => onIndexChange(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex ? 'w-6 bg-pink-600' : 'w-2 bg-gray-300'
            }`}
            aria-label={`Aller au patient ${idx + 1}`}
          />
        ))}
      </div>

      {/* Info de position */}
      <p className="text-xs text-center text-gray-500">
        Patient {currentIndex + 1} / {patients.length}
      </p>
    </div>
  );
}