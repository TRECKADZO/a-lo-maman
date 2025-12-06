import React from 'react';
import { motion } from 'framer-motion';

/**
 * SafeAreaView - Wrapper qui gère les safe areas pour tous les devices
 * Compatible avec les notches iPhone, barres Android, etc.
 */
export function SafeAreaView({ 
  children, 
  className = '',
  edges = ['top', 'bottom', 'left', 'right'],
  bg = 'transparent'
}) {
  const edgeClasses = {
    top: 'pt-[env(safe-area-inset-top)]',
    bottom: 'pb-[env(safe-area-inset-bottom)]',
    left: 'pl-[env(safe-area-inset-left)]',
    right: 'pr-[env(safe-area-inset-right)]',
  };

  const appliedEdges = edges.map(edge => edgeClasses[edge]).join(' ');

  return (
    <div 
      className={`${appliedEdges} ${className}`}
      style={{ backgroundColor: bg }}
    >
      {children}
    </div>
  );
}

/**
 * MobilePageContainer - Container optimisé pour pages mobiles
 * Gère automatiquement les safe areas, le scroll, et la structure
 */
export function MobilePageContainer({ 
  children,
  header,
  footer,
  bg = 'bg-gray-50 dark:bg-gray-950',
  scrollable = true,
  className = ''
}) {
  return (
    <div className={`flex flex-col h-screen ${bg} overflow-hidden`}>
      {/* Header avec safe area top */}
      {header && (
        <SafeAreaView edges={['top']} className="flex-shrink-0">
          {header}
        </SafeAreaView>
      )}

      {/* Main Content */}
      <main 
        className={`flex-1 ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'} ${className}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </main>

      {/* Footer avec safe area bottom */}
      {footer && (
        <SafeAreaView edges={['bottom']} className="flex-shrink-0">
          {footer}
        </SafeAreaView>
      )}
    </div>
  );
}

/**
 * BottomSheet - Bottom sheet native-like avec safe area
 */
export function BottomSheet({ 
  isOpen, 
  onClose, 
  children,
  title,
  fullHeight = false,
  className = ''
}) {
  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl ${
              fullHeight ? 'top-[10%]' : ''
            } ${className}`}
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Title */}
            {title && (
              <div className="px-6 pb-4 border-b dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
              </div>
            )}

            {/* Content */}
            <div className={`${fullHeight ? 'h-full overflow-y-auto' : ''}`}
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}

/**
 * FloatingButton - FAB avec safe area
 */
export function FloatingButton({ 
  onClick, 
  icon, 
  label,
  position = 'bottom-right',
  className = ''
}) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed ${positionClasses[position]} z-40 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-2xl flex items-center gap-2 px-6 py-4 font-semibold ${className}`}
      style={{
        bottom: `calc(1rem + env(safe-area-inset-bottom))`,
      }}
    >
      {icon}
      {label && <span>{label}</span>}
    </motion.button>
  );
}

/**
 * StickyHeader - Header sticky avec safe area
 */
export function StickyHeader({ 
  children, 
  transparent = false,
  blur = true,
  className = ''
}) {
  return (
    <div 
      className={`sticky top-0 z-30 ${
        transparent ? 'bg-transparent' : 'bg-white dark:bg-gray-900'
      } ${blur ? 'backdrop-blur-md bg-opacity-80' : ''} ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * TabBar - Bottom tab bar avec safe area
 */
export function TabBar({ children, className = '' }) {
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t dark:border-gray-800 z-50 ${className}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {children}
    </div>
  );
}

/**
 * KeyboardAvoidingView - Évite le clavier
 */
export function KeyboardAvoidingView({ children, className = '' }) {
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const diff = windowHeight - viewportHeight;
      setKeyboardHeight(diff > 100 ? diff : 0);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      className={`transition-all duration-200 ${className}`}
      style={{ 
        paddingBottom: keyboardHeight,
        maxHeight: '100vh',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  );
}

/**
 * PullToRefresh - Pull to refresh natif
 */
export function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const startY = React.useRef(0);
  const containerRef = React.useRef(null);

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current && containerRef.current?.scrollTop === 0) {
      const distance = e.touches[0].clientY - startY.current;
      if (distance > 0) {
        setPullDistance(Math.min(distance, 100));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = 0;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="overflow-y-auto h-full"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div className="flex justify-center py-4">
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
            className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full"
          />
        </div>
      )}
      {children}
    </div>
  );
}

export default {
  SafeAreaView,
  MobilePageContainer,
  BottomSheet,
  FloatingButton,
  StickyHeader,
  TabBar,
  KeyboardAvoidingView,
  PullToRefresh,
};