import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PinModalProps {
  title?: string;
  correctPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({ title = 'Parental Lock', correctPin, onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(false);
      if (next.length === 4) {
        if (next === correctPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-xs text-slate-400 mb-6">Enter 4-digit PIN to unlock</p>

          {/* Dots */}
          <div className="flex gap-4 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  pin.length > i
                    ? error
                      ? 'bg-red-500 border-red-500 scale-110'
                      : 'bg-teal-400 border-teal-400 scale-110'
                    : 'bg-slate-800 border-slate-600'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-400 mb-4 animate-bounce">
              Incorrect PIN. Try again.
            </p>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <button
                key={d}
                onClick={() => handleDigit(d)}
                className="h-12 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-lg rounded-xl transition border border-slate-700/60 active:scale-95"
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => setPin('')}
              className="h-12 bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-semibold text-xs rounded-xl transition border border-slate-800 active:scale-95"
            >
              Clear
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="h-12 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-lg rounded-xl transition border border-slate-700/60 active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-12 bg-slate-800/40 hover:bg-slate-800 text-slate-400 font-semibold text-sm rounded-xl transition border border-slate-800 active:scale-95"
            >
              ⌫
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
