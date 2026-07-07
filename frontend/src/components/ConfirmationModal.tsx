"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#1a1412] border border-parchment/10 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
          >
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gold/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gold/30" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 flex items-center justify-center border ${isDestructive ? 'border-terracotta/30 text-terracotta' : 'border-gold/30 text-gold'}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-serif text-2xl text-parchment font-light tracking-wide">{title}</h3>
                <div className="h-px w-8 bg-gold/40 mt-1" />
              </div>
              <button 
                onClick={onCancel}
                className="ml-auto text-parchment/30 hover:text-parchment transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <p className="font-serif italic text-lg text-parchment/60 leading-relaxed mb-10">
              {message}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-4 border border-parchment/10 text-parchment/60 font-sans text-xs uppercase tracking-[0.2em] hover:bg-white/5 hover:text-parchment transition-all duration-300 font-bold"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-6 py-4 font-sans text-xs uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                  isDestructive 
                    ? 'bg-terracotta text-parchment hover:bg-[#a84c2e]' 
                    : 'bg-gold text-espresso hover:bg-[#c2a050]'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
