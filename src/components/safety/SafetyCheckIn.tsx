import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle, ShieldAlert, Navigation, Compass, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import { useI18n } from '../../services/i18n';

interface SafetyCheckInProps {
  onTriggerSOS: (reason: string) => void;
}

interface RouteOption {
  name: string;
  duration: number;
}

export const SafetyCheckIn: React.FC<SafetyCheckInProps> = ({ onTriggerSOS }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'TIMER' | 'JOURNEY'>('TIMER');

  // Simple Timer State
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(20); // 20 min default to match "reach home in 20 min"
  const [timerTimeLeft, setTimerTimeLeft] = useState<number | null>(null);
  const [promptTimerActive, setPromptTimerActive] = useState(false);
  const [timerReminderTimeLeft, setTimerReminderTimeLeft] = useState<number | null>(null);

  // Journey Monitor State
  const [journeyEnabled, setJourneyEnabled] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [journeyTimeLeft, setJourneyTimeLeft] = useState<number | null>(null);
  const [deviationStatus, setDeviationStatus] = useState<'NONE' | 'DEVIATED'>('NONE');
  const [escalationTimeLeft, setEscalationTimeLeft] = useState<number | null>(null);

  // "Reached Destination?" Arrival Verification Flow State
  const [promptArrivalActive, setPromptArrivalActive] = useState(false);
  const [reminderTimeLeft, setReminderTimeLeft] = useState<number | null>(null);

  const routesList: RouteOption[] = [
    { name: t('routeHostelHome'), duration: 18 },
    { name: t('routeCollegeHostel'), duration: 14 },
    { name: t('routeHostelLibrary'), duration: 8 }
  ];

  // Get active route duration
  const getSelectedRouteDuration = () => {
    const route = routesList.find(r => r.name === selectedRoute) || routesList[0];
    return route ? route.duration : 15;
  };

  // Keep selectedRoute in sync when language changes
  const effectiveSelectedRoute = selectedRoute || routesList[0]?.name || '';

  // 1. Simple Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (timerEnabled && !promptTimerActive && timerTimeLeft !== null && timerTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            // Timer expired - Prompt and start 30s reminder timer
            clearInterval(interval);
            setPromptTimerActive(true);
            setTimerReminderTimeLeft(30);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerEnabled, promptTimerActive, timerTimeLeft]);

  // 1b. Simple Timer Reminder Escalation Effect
  useEffect(() => {
    let interval: any = null;
    if (promptTimerActive && timerReminderTimeLeft !== null && timerReminderTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerReminderTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setTimerEnabled(false);
            setPromptTimerActive(false);
            setTimerReminderTimeLeft(null);
            onTriggerSOS(`Unacknowledged Safety Check-In Timer Expiry (No Response after 20-min trip limit)`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [promptTimerActive, timerReminderTimeLeft]);

  // 2. Journey Monitor Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (journeyEnabled && !promptArrivalActive && journeyTimeLeft !== null && journeyTimeLeft > 0) {
      interval = setInterval(() => {
        setJourneyTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            // Journey completed - Prompt "Reached Destination?" & start 30s reminder timer
            clearInterval(interval);
            setPromptArrivalActive(true);
            setReminderTimeLeft(30);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [journeyEnabled, promptArrivalActive, journeyTimeLeft]);

  // 3. Arrival Prompt Reminder (No Response ➔ Auto SOS Escalation) Effect
  useEffect(() => {
    let interval: any = null;
    if (promptArrivalActive && reminderTimeLeft !== null && reminderTimeLeft > 0) {
      interval = setInterval(() => {
        setReminderTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setJourneyEnabled(false);
            setPromptArrivalActive(false);
            setReminderTimeLeft(null);
            onTriggerSOS(`Unacknowledged Destination Arrival Prompt (No Response on reaching ${selectedRoute})`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [promptArrivalActive, reminderTimeLeft]);

  // 4. Route Deviation Escalation Effect
  useEffect(() => {
    let interval: any = null;
    if (deviationStatus === 'DEVIATED' && escalationTimeLeft !== null && escalationTimeLeft > 0) {
      interval = setInterval(() => {
        setEscalationTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setJourneyEnabled(false);
            setDeviationStatus('NONE');
            onTriggerSOS('Route Deviation Detection - Auto Escalation Triggered');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deviationStatus, escalationTimeLeft]);
  // Safety Timer Destination Check Effect
  useEffect(() => {
    let interval: any = null;
    if (journeyEnabled) {
      interval = setInterval(() => {
        // Placeholder check when journey is active
      }, 60000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [journeyEnabled]);
  // Simple Timer Handlers
  const handleStartTimer = () => {
    setTimerTimeLeft(timerMinutes * 60);
    setPromptTimerActive(false);
    setTimerReminderTimeLeft(null);
    setTimerEnabled(true);
  };

  const handleStopTimerClean = () => {
    setTimerEnabled(false);
    setTimerTimeLeft(null);
    setPromptTimerActive(false);
    setTimerReminderTimeLeft(null);
  };

  const triggerMockTimerExpiry = () => {
    setTimerTimeLeft(0);
    setPromptTimerActive(true);
    setTimerReminderTimeLeft(30);
  };

  // Journey Monitor Handlers
  const handleStartJourney = () => {
    const mins = getSelectedRouteDuration();
    setJourneyTimeLeft(mins * 60);
    setDeviationStatus('NONE');
    setPromptArrivalActive(false);
    setReminderTimeLeft(null);
    setJourneyEnabled(true);
  };

  const handleStopJourneyClean = () => {
    setJourneyEnabled(false);
    setJourneyTimeLeft(null);
    setDeviationStatus('NONE');
    setPromptArrivalActive(false);
    setReminderTimeLeft(null);
  };

  const triggerMockDeviation = () => {
    setDeviationStatus('DEVIATED');
    setEscalationTimeLeft(30);
  };

  const handleAcknowledgeDeviationSafe = () => {
    setDeviationStatus('NONE');
    setEscalationTimeLeft(null);
  };

  const triggerMockArrival = () => {
    setJourneyTimeLeft(0);
    setPromptArrivalActive(true);
    setReminderTimeLeft(30);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl space-y-4">
      
      {/* Mode Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => { if (!timerEnabled && !journeyEnabled) setActiveTab('TIMER'); }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'TIMER' 
              ? 'bg-slate-800 text-white border border-slate-700' 
              : 'text-slate-400 hover:text-white'
          }`}
          disabled={timerEnabled || journeyEnabled}
        >
          {t('checkInTab')}
        </button>
        <button
          onClick={() => { if (!timerEnabled && !journeyEnabled) setActiveTab('JOURNEY'); }}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'JOURNEY' 
              ? 'bg-slate-800 text-white border border-slate-700' 
              : 'text-slate-400 hover:text-white'
          }`}
          disabled={timerEnabled || journeyEnabled}
        >
          {t('journeyTab')}
        </button>
      </div>

      {/* 1. SIMPLE CHECK-IN TIMER MODE VIEW */}
      {activeTab === 'TIMER' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('timedCheckInTitle')}</h3>
              <p className="text-[10px] text-slate-500">{t('timedCheckInDesc')}</p>
            </div>
          </div>

          {timerEnabled && timerTimeLeft !== null ? (
            <div className="space-y-3">
              
              {/* Active Timer Box */}
              {!promptTimerActive ? (
                <div className="flex flex-col items-center p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    {t('checkinTimerActiveTitle')}
                  </div>
                  <div className="text-4xl font-black font-mono text-white animate-pulse">
                    {formatTime(timerTimeLeft)}
                  </div>
                  <p className="text-[10px] text-slate-300">
                    {t('checkinWarningDesc')}
                  </p>
                  
                  <div className="flex gap-2 w-full pt-1.5">
                    <button
                      onClick={handleStopTimerClean}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95"
                    >
                      {t('iamSafeCancel')}
                    </button>
                    <button
                      onClick={triggerMockTimerExpiry}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-xl text-xs font-bold transition-all border border-slate-705"
                    >
                      {t('mockExpiryBtn')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Unacknowledged Overdue Timer Verification Drawer ("Reached?") */
                <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-center space-y-3 animate-pulse">
                  <div className="flex items-center justify-center space-x-2 text-xs font-bold text-red-400">
                    <HelpCircle className="h-4.5 w-4.5" />
                    <span>{t('checkinOverdueTitle')}</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    {t('confirmSafetyDesc')}
                  </p>
                  
                  <div className="text-3xl font-black font-mono text-white">
                    {formatTime(timerReminderTimeLeft || 0)}
                  </div>

                  <button
                    onClick={handleStopTimerClean}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95"
                  >
                    {t('yesIamSafeFinish')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{t('selectDurationLabel')}</span>
                <div className="flex space-x-1">
                  {[5, 10, 15, 30, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setTimerMinutes(m)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        timerMinutes === m ? 'bg-amber-600 text-white' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStartTimer}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Timer className="h-4 w-4 text-amber-400" />
                <span>{t('startMinutesCheckIn').replace('{minutes}', String(timerMinutes))}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. JOURNEY ROUTE MONITORING MODE VIEW */}
      {activeTab === 'JOURNEY' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('liveJourneyMonitorTitle')}</h3>
              <p className="text-[10px] text-slate-500">{t('liveJourneyMonitorDesc')}</p>
            </div>
          </div>

          {journeyEnabled && journeyTimeLeft !== null ? (
            <div className="space-y-3">
              
              {/* Journey Monitoring HUD */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs">
                <div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase">{t('tripLabel')}</div>
                  <div className="font-bold text-slate-200 mt-0.5 truncate">{selectedRoute}</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase">{t('etaDurationLabel')}</div>
                  <div className="font-bold font-mono text-slate-200 mt-0.5">
                    {promptArrivalActive ? t('arrivedText') : formatTime(journeyTimeLeft)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase">{t('routePathLabel')}</div>
                  <div className="font-bold text-emerald-400 mt-0.5 flex items-center space-x-1">
                    <Compass className="h-3 w-3 animate-spin" />
                    <span>{t('normalRouteText')}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase">{t('deviationStatusLabel')}</div>
                  <span className={`font-bold ${deviationStatus === 'DEVIATED' ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                    {deviationStatus === 'DEVIATED' ? t('deviationAlertText') : t('deviationNoneText')}
                  </span>
                </div>
              </div>

              {/* Destination Arrival Verify Prompt ("Reached?") */}
              {promptArrivalActive && reminderTimeLeft !== null && (
                <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-2xl text-center space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-xs font-bold text-amber-400">
                    <HelpCircle className="h-4.5 w-4.5" />
                    <span>{t('reachedDestSafeTitle')}</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    {t('arrivalElapsedDesc')}
                  </p>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleStopJourneyClean}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95"
                    >
                      {t('yesFinishTrip')}
                    </button>
                    <button
                      onClick={() => {
                        setReminderTimeLeft(15); 
                      }}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl border border-slate-700 transition-all active:scale-95"
                    >
                      {t('noNotYet')}
                    </button>
                  </div>

                  <div className="text-[9px] text-slate-500">
                    {t('unackSosEscalationText')} <strong className="font-mono text-red-400">{reminderTimeLeft}s</strong>
                  </div>
                </div>
              )}

              {/* Deviation Trigger Alert Drawer */}
              {deviationStatus === 'DEVIATED' && escalationTimeLeft !== null && (
                <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-center space-y-3 animate-pulse">
                  <div className="flex items-center justify-center space-x-2 text-xs font-bold text-red-400">
                    <AlertTriangle className="h-4.5 w-4.5" />
                    <span>{t('criticalDeviationTitle')}</span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    {t('coordinatesDriftDesc')}
                  </p>
                  <div className="text-3xl font-black font-mono text-white">
                    {formatTime(escalationTimeLeft)}
                  </div>
                  <button
                    onClick={handleAcknowledgeDeviationSafe}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95"
                  >
                    {t('confirmSafeDismiss')}
                  </button>
                </div>
              )}

              {/* Simulator Action Drawer & Controls */}
              {deviationStatus === 'NONE' && !promptArrivalActive && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={triggerMockDeviation}
                    className="flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-[9px] text-slate-400 font-semibold border border-slate-850"
                  >
                    <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                    <span>{t('deviatePathBtn')}</span>
                  </button>
                  <button
                    onClick={triggerMockArrival}
                    className="flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-[9px] text-slate-400 font-semibold border border-slate-850"
                  >
                    <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span>{t('completeTripBtn')}</span>
                  </button>
                </div>
              )}

              {!promptArrivalActive && (
                <button
                  onClick={handleStopJourneyClean}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-xl text-xs font-bold transition-all active:scale-95 border border-slate-700"
                >
                  {t('cancelJourneyMonitorBtn')}
                </button>
              )}

            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col space-y-1.5">
                <span className="text-xs text-slate-300">{t('selectTripCorridorLabel')}</span>
                <select
                  value={effectiveSelectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 focus:outline-none focus:border-slate-700"
                >
                  {routesList.map((route, index) => (
                    <option key={index} value={route.name}>
                      {route.name} {t('corridorSuffix')} ({route.duration} min)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartJourney}
                className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-800 border border-slate-700 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Play className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t('startJourneyBtn')} ({getSelectedRouteDuration()} min)</span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
