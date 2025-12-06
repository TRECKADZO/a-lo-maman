import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Variants pour différentes animations
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

const fadeVariants = {
  enter: {
    opacity: 0,
    scale: 0.98,
  },
  center: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
  },
};

const slideUpVariants = {
  enter: {
    y: '100%',
    opacity: 0,
  },
  center: {
    y: 0,
    opacity: 1,
  },
  exit: {
    y: '100%',
    opacity: 0,
  },
};

const scaleVariants = {
  enter: {
    scale: 0.9,
    opacity: 0,
  },
  center: {
    scale: 1,
    opacity: 1,
  },
  exit: {
    scale: 1.1,
    opacity: 0,
  },
};

// Composant principal de transition
export function PageTransition({ 
  children, 
  type = 'slide',
  direction = 1,
  duration = 0.3,
  className = ''
}) {
  const variants = {
    slide: slideVariants,
    fade: fadeVariants,
    slideUp: slideUpVariants,
    scale: scaleVariants,
  }[type] || slideVariants;

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        duration,
        type: 'tween',
        ease: [0.4, 0, 0.2, 1], // iOS-like easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Wrapper pour AnimatePresence
export function PageTransitionWrapper({ children, mode = 'wait' }) {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
}

// Transition pour modals
export function ModalTransition({ children, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed inset-x-0 bottom-0 z-50"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Transition pour listes (stagger animation)
export function ListTransition({ children, staggerDelay = 0.05 }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Transition pour cartes (fade + scale)
export function CardTransition({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{
        duration: 0.3,
        delay,
        type: 'spring',
        damping: 25,
        stiffness: 300,
      }}
    >
      {children}
    </motion.div>
  );
}

// Transition pour tabs
export function TabTransition({ children, selectedTab }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Transition pour pull-to-refresh
export function PullToRefreshIndicator({ progress, isRefreshing }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: isRefreshing ? 1 : progress,
        y: isRefreshing ? 0 : -20 + (20 * progress),
      }}
      className="flex justify-center py-4"
    >
      <motion.div
        animate={{ rotate: isRefreshing ? 360 : 0 }}
        transition={{
          duration: 1,
          repeat: isRefreshing ? Infinity : 0,
          ease: 'linear',
        }}
        className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full"
      />
    </motion.div>
  );
}

// Slide lateral pour panneau
export function SidePanelTransition({ children, isOpen, side = 'right' }) {
  const slideDirection = side === 'right' ? '100%' : '-100%';
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          <motion.div
            initial={{ x: slideDirection }}
            animate={{ x: 0 }}
            exit={{ x: slideDirection }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className={`fixed top-0 ${side}-0 bottom-0 z-50 w-full max-w-md`}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default {
  PageTransition,
  PageTransitionWrapper,
  ModalTransition,
  ListTransition,
  CardTransition,
  TabTransition,
  PullToRefreshIndicator,
  SidePanelTransition,
};