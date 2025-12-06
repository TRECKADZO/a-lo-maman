import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

export default function FloatingActionButton({ actions = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-4 z-50 lg:hidden flex flex-col-reverse items-end gap-3">
        <AnimatePresence>
          {isOpen && actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.label}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`${action.color || 'bg-white'} shadow-lg h-12 px-4 active:scale-95 transition-transform`}
                  variant={action.variant || 'default'}
                >
                  <Icon className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="truncate">{action.label}</span>
                </Button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
          animate={{ rotate: isOpen ? 45 : 0 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </motion.button>
      </div>
    </>
  );
}