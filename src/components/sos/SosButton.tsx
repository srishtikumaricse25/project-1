import React, { useState, useRef, useEffect } from 'react';
import { AlertOctagon, ShieldCheck, Zap, XCircle, AlertTriangle, Radio } from 'lucide-react';
import { EmergencyAlert } from '../../types';
import { useI18n } from '../../services/i18n';

interface SosButtonProps {
  onTriggerAlert: (triggerMethod: string) => void;
  activeAlert: EmergencyAlert | null;
  onOpenDeactivate: () => void;
  sosAlertsEnabled?: boolean;
}

export const SosButton: React.FC<SosButtonProps> = ({
  onTriggerAlert,
  activeAlert,
  onOpenDeactivate,
  sosAlertsEnabled = true
}) => {
  const { t } = useI18n();
  const [pressMode, setPressMode] = useState<'HOLD' | 'INSTANT'>('HOLD');
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [disabledWarning, setDisabledWarning] = useState(false);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  // Countdown State for SOS Trigger
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(10);
  const [countdownMethod, setCountdownMethod] = useState('');
  const countdownIntervalRef = useRef<any>(null);

  const HOLD_DURATION_MS = 3000; // 3 Seconds hold requirement for Silent SOS

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const startCountdown = (method: string) => {
    setCountdownMethod(method);
    setCountdownTimeLeft(10);
    setIsCountingDown(true);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Gentle warning vibration if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 100, 100]);
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdownTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          setIsCountingDown(false);
          onTriggerAlert(method);
          return 0;
        }
        // Vibrate every second as warning feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setIsCountingDown(false);
    setCountdownTimeLeft(10);
    setCountdownMethod('');
  };

  const handleMouseDown = () => {
    if (!sosAlertsEnabled) {
      setDisabledWarning(true);
      setTimeout(() => setDisabledWarning(false), 4000);
      return;
    }
    if (activeAlert || isCountingDown) return;

    if (pressMode === 'INSTANT') {
      startCountdown('Single-Tap SOS Trigger');
      return;
    }

    setIsPressing(true);
    startTimeRef.current = Date.now();

    // Vibrate device if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / HOLD_DURATION_MS) * 100, 100);
      setProgress(pct);

      if (elapsed >= HOLD_DURATION_MS) {
        clearInterval(timerRef.current);
        setIsPressing(false);
        setProgress(0);
        if ('vibrate' in navigator) {
          navigator.vibrate([300, 100, 300]);
        }
        startCountdown('3-Second Silent Hold SOS Trigger');
      }
    }, 30);
  };

  const handleMouseUp = () => {
    if (pressMode === 'HOLD' && timerRef.current) {
      clearInterval(timerRef.current);
      setIsPressing(false);
      setProgress(0);
    }
  };

  // Calculate countdown ring progress
  const countdownProgress = ((10 - countdownTimeLeft) / 10) * 100;
  const ringCircumference = 2 * Math.PI * 90; // radius 90

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-slate-900/60 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
      
      {/* Mode Selector - hidden when counting down or active */}
      {!activeAlert && !isCountingDown && (
        <div className="absolute top-4 right-4 flex items-center space-x-1 bg-slate-950 p-1 rounded-full border border-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => setPressMode('HOLD')}
            className={`px-3 py-1 rounded-full transition-all ${
              pressMode === 'HOLD' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('hold3s')}
          </button>
          <button
            onClick={() => setPressMode('INSTANT')}
            className={`px-3 py-1 rounded-full transition-all ${
              pressMode === 'INSTANT' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('instantTap')}
          </button>
        </div>
      )}

      {(!sosAlertsEnabled || disabledWarning) && (
        <div className="mb-4 w-full rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 text-center animate-fadeIn">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Emergency SOS Disabled in Settings</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Re-enable "Emergency SOS Active" in Settings to send emergency alerts.
          </p>
        </div>
      )}

      <div className="mb-4 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-red-500">
          {activeAlert ? t('sosTriggered') : isCountingDown ? t('countdownText') : t('silentHold')}
        </span>
      </div>

      {/* 1. SOS COUNTDOWN CONFIRMATION VIEW */}
      {isCountingDown && !activeAlert ? (
        <div className="flex flex-col items-center w-full text-center py-2 space-y-5">
          
          {/* SOS Activated Header */}
          <div className="w-full rounded-2xl bg-red-500/[0.06] border border-red-500/20 px-5 py-4 space-y-1">
            <div className="flex items-center justify-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400 animate-pulse" />
              <h3 className="text-base font-black text-red-400 uppercase tracking-wider">{t('sosTriggered')}</h3>
            </div>
            <p className="text-xs text-slate-400 font-semibold">{t('countdownText')}</p>
          </div>

          {/* Countdown Circle with Animated Ring */}
          <div className="relative flex items-center justify-center">
            {/* Pulsing outer glow */}
            <div className="absolute -inset-4 rounded-full bg-red-500/10 animate-pulse blur-xl" />
            
            {/* SVG Ring Progress */}
            <svg className="absolute h-52 w-52 -rotate-90" viewBox="0 0 200 200">
              {/* Background track ring */}
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-800"
                fill="transparent"
              />
              {/* Progress ring - fills as time runs out */}
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke="currentColor"
                strokeWidth="6"
                className="text-red-500 transition-all duration-1000 ease-linear"
                fill="transparent"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference - (ringCircumference * countdownProgress) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Circle with Number */}
            <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full bg-slate-950 border-2 border-red-500/30">
              {/* Large countdown number */}
              <span className={`text-7xl font-black font-mono tracking-tight transition-all duration-300 ${
                countdownTimeLeft <= 3 ? 'text-red-500 scale-110' : 'text-white'
              }`}>
                {countdownTimeLeft}
              </span>
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                {t('secondsSuffix')}
              </span>
            </div>
          </div>

          {/* Warning Text */}
          <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">
            {t('countdownText')}
          </p>

          {/* Cancel Button */}
          <button
            onClick={handleCancelCountdown}
            className="w-full flex items-center justify-center space-x-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 py-4 font-bold text-white border border-slate-700 hover:border-red-500/30 shadow-lg transition-all transform active:scale-[0.97] text-sm uppercase tracking-wider"
          >
            <XCircle className="h-5 w-5 text-red-400" />
            <span>{t('cancel')}</span>
          </button>
        </div>
      ) : activeAlert ? (
        /* 2. EMERGENCY ALERT ACTIVE VIEW */
        <div className="flex flex-col items-center w-full max-w-sm">
          {/* Pulsing Emergency Center Circle */}
          <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-900 p-1 shadow-2xl shadow-red-600/50 animate-pulse">
            <div className="flex h-48 w-48 flex-col items-center justify-center rounded-full bg-slate-950 border-4 border-red-500 text-red-500">
              <AlertOctagon className="h-12 w-12 mb-1 animate-bounce" />
              <span className="font-black text-base text-white tracking-widest">{t('sosTriggered')}</span>
              <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider mt-1">
                {activeAlert.status === 'DISPATCHED' ? t('stepAssigned') : t('broadcastingText')}
              </span>
            </div>
          </div>

          {/* Dynamic Emergency Telemetry Hub */}
          <div className="mt-6 w-full rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3.5 text-left">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center justify-between">
              <span>{t('dispatchStatusHeader')}</span>
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            </div>

            {activeAlert.status === 'DISPATCHED' ? (
              <div className="space-y-3">
                {/* Acknowledged / Responding State */}
                <div className="flex items-start space-x-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">
                      {activeAlert.dispatcherNotes?.includes('Warden') ? t('wardenRespondingText') : t('securityDeskRespondingText')}
                    </div>
                    <p className="text-[10px] text-slate-400">{t('dispatcherAckNotesDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-400">{t('stepEnRoute')}</div>
                    <p className="text-[10px] text-slate-400">{t('stepEnRouteDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 opacity-50">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-500 text-[10px] font-bold">
                    i
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-300">{t('localGovtServicesLabel')}</div>
                    <p className="text-[10px] text-slate-500">{t('localGovtServicesDesc')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active SOS Streaming State */}
                <div className="flex items-start space-x-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">{t('stepTriggered')}</div>
                    <p className="text-[10px] text-slate-400">{t('stepTriggeredDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
                      <span>{t('sosDeliveredText')}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{t('stepNotifiedDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
                      <span>{t('emailDeliveredText')}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{t('stepNotifiedDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
                      <span>{t('liveLocSharedText')}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{t('shareLiveLoc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100">{t('liveGpsStream')}</div>
                    <p className="text-[10px] text-slate-400">{t('activeLocation')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse text-xs font-bold">
                    ⏳
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-400 animate-pulse">{t('stepAwaitingAck')}</div>
                    <p className="text-[10px] text-slate-400">{t('stepAwaitingAckDesc')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onOpenDeactivate}
            className="mt-6 w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all transform active:scale-95 text-xs uppercase tracking-wider"
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            <span>{t('deactivateSos')}</span>
          </button>
        </div>
      ) : (
        /* 3. STANDBY TRADITIONAL SOS BUTTON VIEW */
        <div className="flex flex-col items-center text-center">
          <div className="relative group cursor-pointer select-none">
            
            {/* Pulsing glow backplate - reduced glow for text readability */}
            <div className="absolute -inset-5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-800 opacity-15 blur-xl group-hover:opacity-25 transition duration-500 animate-pulse"></div>

            {/* Hold progress radial background wrapper (size increased to h-56 w-56) */}
            <div
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              className={`relative flex h-56 w-56 items-center justify-center rounded-full bg-gradient-to-br from-red-600 via-rose-600 to-red-800 p-2 shadow-xl shadow-red-600/25 transition-transform active:scale-95 ${
                isPressing ? 'scale-105' : ''
              }`}
            >
              {/* SVG Radial Progress Circle */}
              {pressMode === 'HOLD' && isPressing && (
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle
                    cx="112"
                    cy="112"
                    r="105"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white opacity-20"
                    fill="transparent"
                  />
                  <circle
                    cx="112"
                    cy="112"
                    r="105"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white transition-all duration-75"
                    fill="transparent"
                    strokeDasharray={659.73}
                    strokeDashoffset={659.73 - (659.73 * progress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* Inner Circle content (solid bg for high-contrast crisp text) */}
              <div className="flex h-52 w-52 flex-col items-center justify-center rounded-full bg-slate-950 border-2 border-red-500/50 hover:border-red-400 text-white transition-all">
                <Zap className="h-14 w-14 text-red-500 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-black text-3xl tracking-widest text-red-500 drop-shadow">SOS</span>
                <span className="text-[10px] text-slate-300 font-bold tracking-widest mt-1">
                  {pressMode === 'HOLD' ? (isPressing ? t('sendingText') : t('silentHold')) : t('tapSosText')}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-400 max-w-xs leading-relaxed">
            {pressMode === 'HOLD'
              ? t('pressHoldExplainText')
              : t('tapInstantExplainText')}
          </p>
        </div>
      )}

    </div>
  );
};
