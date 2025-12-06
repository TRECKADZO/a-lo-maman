import React from 'react';
import { motion } from 'framer-motion';

/**
 * Touchable - Composant cliquable avec feedback natif
 */
export function Touchable({ 
  children, 
  onPress,
  haptic = false,
  scale = 0.97,
  disabled = false,
  className = '',
  ...props
}) {
  const handlePress = () => {
    if (disabled) return;
    
    // Haptic feedback (sur devices supportés)
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onPress?.();
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : scale }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={handlePress}
      disabled={disabled}
      className={`touch-manipulation ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:opacity-80'} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * Swipeable - Composant swipeable (pour actions)
 */
export function Swipeable({ 
  children, 
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  threshold = 100,
  className = ''
}) {
  const [dragX, setDragX] = React.useState(0);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Actions cachées */}
      {leftAction && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-start pl-4 bg-red-500 text-white"
          style={{ width: Math.max(0, -dragX) }}
        >
          {leftAction}
        </div>
      )}
      {rightAction && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 bg-green-500 text-white"
          style={{ width: Math.max(0, dragX) }}
        >
          {rightAction}
        </div>
      )}

      {/* Contenu swipeable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: leftAction ? -200 : 0, right: rightAction ? 200 : 0 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset }) => {
          if (offset.x < -threshold && onSwipeLeft) {
            onSwipeLeft();
          } else if (offset.x > threshold && onSwipeRight) {
            onSwipeRight();
          }
          setDragX(0);
        }}
        onDrag={(e, { offset }) => setDragX(offset.x)}
        className="relative z-10 bg-white dark:bg-gray-900"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * LongPress - Composant avec support long press
 */
export function LongPress({ 
  children, 
  onLongPress,
  duration = 500,
  haptic = true,
  className = ''
}) {
  const timerRef = React.useRef(null);
  const [isPressed, setIsPressed] = React.useState(false);

  const handleStart = () => {
    setIsPressed(true);
    timerRef.current = setTimeout(() => {
      if (haptic && 'vibrate' in navigator) {
        navigator.vibrate([10, 20, 10]);
      }
      onLongPress?.();
    }, duration);
  };

  const handleEnd = () => {
    setIsPressed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return (
    <motion.div
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      animate={{ scale: isPressed ? 0.97 : 1 }}
      transition={{ duration: 0.1 }}
      className={`touch-manipulation ${className}`}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollIndicator - Indicateur de scroll natif
 */
export function ScrollIndicator({ progress, className = '' }) {
  return (
    <div className={`fixed top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 z-50 ${className}`}>
      <motion.div
        className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
        style={{ width: `${progress * 100}%` }}
        transition={{ type: 'spring', stiffness: 100 }}
      />
    </div>
  );
}

/**
 * ExpandableCard - Carte expandable native-like
 */
export function ExpandableCard({ 
  title, 
  children, 
  defaultExpanded = false,
  icon,
  className = ''
}) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <motion.div
      initial={false}
      animate={{ backgroundColor: isExpanded ? '#f9fafb' : '#ffffff' }}
      className={`rounded-2xl overflow-hidden shadow-sm ${className}`}
    >
      <Touchable
        onPress={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </Touchable>

      <motion.div
        initial={false}
        animate={{ 
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        <div className="p-4 pt-0">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * FloatingActionMenu - Menu flottant natif
 */
export function FloatingActionMenu({ 
  actions = [],
  icon,
  className = ''
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={`fixed bottom-20 right-4 z-40 ${className}`}
      style={{ bottom: `calc(5rem + env(safe-area-inset-bottom))` }}
    >
      {/* Actions */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="mb-4 space-y-3"
        >
          {actions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 justify-end"
            >
              {action.label && (
                <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                  {action.label}
                </span>
              )}
              <Touchable
                onPress={() => {
                  action.onPress();
                  setIsOpen(false);
                }}
                className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center"
              >
                {action.icon}
              </Touchable>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Main Button */}
      <Touchable
        onPress={() => setIsOpen(!isOpen)}
        haptic
        className="w-14 h-14 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-2xl flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
      </Touchable>
    </div>
  );
}

/**
 * SegmentedControl - Contrôle segmenté iOS-like
 */
export function SegmentedControl({ 
  options = [],
  value,
  onChange,
  className = ''
}) {
  const selectedIndex = options.findIndex(opt => opt.value === value);

  return (
    <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex ${className}`}>
      {options.map((option, index) => (
        <Touchable
          key={option.value}
          onPress={() => onChange(option.value)}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors relative ${
            value === option.value 
              ? 'text-gray-900 dark:text-white' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {value === option.value && (
            <motion.div
              layoutId="segmentedControlBackground"
              className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </Touchable>
      ))}
    </div>
  );
}

export default {
  Touchable,
  Swipeable,
  LongPress,
  ScrollIndicator,
  ExpandableCard,
  FloatingActionMenu,
  SegmentedControl,
};