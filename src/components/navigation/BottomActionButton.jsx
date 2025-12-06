import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function BottomActionButton({ 
  onClick, 
  icon: Icon, 
  label, 
  variant = 'default',
  className = '',
  disabled = false
}) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-20 left-0 right-0 px-4 z-40 lg:hidden safe-area-bottom"
    >
      <Button
        onClick={onClick}
        disabled={disabled}
        className={`w-full h-14 shadow-2xl text-base font-semibold active:scale-95 transition-transform ${className}`}
        variant={variant}
      >
        {Icon && <Icon className="w-5 h-5 mr-3" />}
        {label}
      </Button>
    </motion.div>
  );
}