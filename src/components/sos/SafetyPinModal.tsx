import React, { useState } from 'react';
import { Lock, Check, X } from 'lucide-react';
import { useI18n } from '../../services/i18n';

interface SafetyPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeactivate: (pin: string) => Promise<void>;
}

export const SafetyPinModal: React.FC<SafetyPinModalProps> = ({
  isOpen,
  onClose,
  onConfirmDeactivate
}) => {
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError(t('pinInvalid'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onConfirmDeactivate(pin);
      setPin('');
      onClose();
    } catch (e: any) {
      setError(e.message || t('pinInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <Lock className="h-4 w-4" />
            <span>{t('enterSafetyPin')}</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-6 text-center">
          {t('enterSafetyPinSub')}
        </p>

        {/* PIN Display Dots */}
        <div className="flex justify-center space-x-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                idx < pin.length
                  ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                  : 'border-slate-700 bg-slate-950'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-2 text-center text-xs font-semibold text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-slate-800 text-lg font-bold text-slate-100 hover:bg-slate-700 active:scale-95 transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-slate-800 text-sm font-semibold text-slate-400 hover:bg-slate-700 active:scale-95"
          >
            {t('del')}
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-800 text-lg font-bold text-slate-100 hover:bg-slate-700 active:scale-95"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || pin.length < 4}
            className="h-12 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 active:scale-95 disabled:opacity-50 flex items-center justify-center shadow-lg shadow-emerald-600/30"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          {t('defaultSafetyPinLabel')} <span className="font-mono font-bold text-emerald-400">1234</span>
        </div>

      </div>
    </div>
  );
};
