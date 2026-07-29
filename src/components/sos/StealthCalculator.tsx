import React, { useState } from 'react';
import { Eye, Calculator } from 'lucide-react';
import { useI18n } from '../../services/i18n';

interface StealthCalculatorProps {
  onTriggerSOS: (method: string) => void;
  onExitStealth: () => void;
  stealthCode?: string;
}

export const StealthCalculator: React.FC<StealthCalculatorProps> = ({
  onTriggerSOS,
  onExitStealth,
  stealthCode = '9999'
}) => {
  const { t } = useI18n();
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [secretBuffer, setSecretBuffer] = useState('');
  const [triggeredNotice, setTriggeredNotice] = useState(false);

  const handleDigit = (digit: string) => {
    if (display === '0') setDisplay(digit);
    else setDisplay(display + digit);

    const newBuffer = (secretBuffer + digit).slice(-8);
    setSecretBuffer(newBuffer);

    // If typed secret code (e.g. 9999), trigger stealth SOS!
    if (newBuffer.endsWith(stealthCode)) {
      triggerSilentSOS();
    }
  };

  const handleOp = (op: string) => {
    setEquation(`${display} ${op} `);
    setDisplay('0');
    setSecretBuffer('');
  };

  const safeEval = (expr: string): number => {
    try {
      const sanitized = expr.replace(/[^0-9+\-*/.]/g, '');
      // Safe Function calculation instead of direct eval
      return Function(`"use strict"; return (${sanitized})`)();
    } catch {
      return NaN;
    }
  };

  const handleEquals = () => {
    try {
      const expr = (equation + display).replace(/×/g, '*').replace(/÷/g, '/');
      const result = safeEval(expr);
      setDisplay(isNaN(result) ? 'Error' : String(result));
      setEquation('');
    } catch {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setSecretBuffer('');
  };

  const triggerSilentSOS = () => {
    onTriggerSOS('Stealth Calculator Secret Code Trigger');
    setTriggeredNotice(true);
    setTimeout(() => setTriggeredNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none">
      
      {/* Stealth Disguise Disguise Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2.5">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold">
          <Calculator className="h-4 w-4 text-emerald-400" />
          <span>Calculator Utility v2.4</span>
        </div>
        <button
          onClick={onExitStealth}
          className="flex items-center space-x-1 rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{t('exitStealth')}</span>
        </button>
      </div>

      {/* Calculator Display */}
      <div className="flex flex-1 flex-col justify-end p-6 bg-slate-950 text-right">
        {triggeredNotice && (
          <div className="self-center mb-4 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 animate-pulse">
            ✓ {t('liveLocSharedText')}
          </div>
        )}
        <div className="text-slate-500 text-lg font-mono min-h-[1.75rem]">{equation}</div>
        <div className="text-5xl font-extralight tracking-tight font-mono text-slate-100 overflow-x-auto">
          {display}
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-4 gap-3 p-6 bg-slate-900/90 border-t border-slate-800 max-w-md mx-auto w-full">
        <button onClick={handleClear} className="h-16 rounded-full bg-slate-700 text-slate-100 font-medium text-xl hover:bg-slate-600 active:scale-95">C</button>
        <button onClick={() => setDisplay(String(-parseFloat(display)))} className="h-16 rounded-full bg-slate-700 text-slate-100 font-medium text-xl hover:bg-slate-600 active:scale-95">±</button>
        <button onClick={() => setDisplay(String(parseFloat(display) / 100))} className="h-16 rounded-full bg-slate-700 text-slate-100 font-medium text-xl hover:bg-slate-600 active:scale-95">%</button>
        <button onClick={() => handleOp('÷')} className="h-16 rounded-full bg-amber-600 text-white font-medium text-2xl hover:bg-amber-500 active:scale-95">÷</button>

        <button onClick={() => handleDigit('7')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">7</button>
        <button onClick={() => handleDigit('8')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">8</button>
        <button onClick={() => handleDigit('9')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">9</button>
        <button onClick={() => handleOp('×')} className="h-16 rounded-full bg-amber-600 text-white font-medium text-2xl hover:bg-amber-500 active:scale-95">×</button>

        <button onClick={() => handleDigit('4')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">4</button>
        <button onClick={() => handleDigit('5')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">5</button>
        <button onClick={() => handleDigit('6')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">6</button>
        <button onClick={() => handleOp('-')} className="h-16 rounded-full bg-amber-600 text-white font-medium text-2xl hover:bg-amber-500 active:scale-95">-</button>

        <button onClick={() => handleDigit('1')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">1</button>
        <button onClick={() => handleDigit('2')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">2</button>
        <button onClick={() => handleDigit('3')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">3</button>
        <button onClick={() => handleOp('+')} className="h-16 rounded-full bg-amber-600 text-white font-medium text-2xl hover:bg-amber-500 active:scale-95">+</button>

        <button onClick={() => handleDigit('0')} className="col-span-2 h-16 rounded-full bg-slate-800 text-white text-2xl pl-8 text-left hover:bg-slate-700 active:scale-95">0</button>
        <button onClick={() => handleDigit('.')} className="h-16 rounded-full bg-slate-800 text-white text-2xl hover:bg-slate-700 active:scale-95">.</button>
        <button
          onClick={handleEquals}
          onContextMenu={(e) => { e.preventDefault(); triggerSilentSOS(); }}
          className="h-16 rounded-full bg-emerald-600 text-white font-bold text-2xl hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-600/30"
        >
          =
        </button>
      </div>

      <div className="p-3 text-center text-[11px] text-slate-500 border-t border-slate-800/20">
        {t('stealthCalHelpTextPrefix')}<span className="font-mono text-slate-400">{stealthCode}</span>{t('stealthCalHelpTextSuffix')}
      </div>
    </div>
  );
};
