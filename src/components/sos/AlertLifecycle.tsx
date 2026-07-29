import React from 'react';
import { ShieldAlert, UserCheck, Shield, Compass, MapPin, CheckCircle2 } from 'lucide-react';
import { EmergencyAlert } from '../../types';
import { useI18n } from '../../services/i18n';

interface AlertLifecycleProps {
  activeAlert: EmergencyAlert | null;
  gpsConnected: boolean;
}

export const AlertLifecycle: React.FC<AlertLifecycleProps> = ({ activeAlert, gpsConnected }) => {
  const { t } = useI18n();
  // Determine current lifecycle step index (-1 to 5)
  let currentStep = -1;

  if (activeAlert) {
    switch (activeAlert.status) {
      case 'ACTIVE':
        currentStep = 0;
        break;
      case 'ACCEPTED':
        currentStep = 1;
        break;
      case 'NAVIGATING':
        currentStep = 2;
        break;
      case 'DISPATCHED':
        currentStep = 3;
        break;
      case 'ARRIVED':
        currentStep = 4;
        break;
      case 'RESOLVED':
      case 'FALSE_ALARM':
        currentStep = 5;
        break;
      default:
        currentStep = 0;
    }
  }

  const steps = [
    { label: t('stepTriggered'), icon: ShieldAlert, activeColor: 'text-red-500 bg-red-500/10 border-red-500/30' },
    { label: t('stepAwaitingAck'), icon: UserCheck, activeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { label: t('stepAssigned'), icon: Shield, activeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    { label: t('stepEnRoute'), icon: Compass, activeColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30 animate-pulse' },
    { label: t('stepReached'), icon: MapPin, activeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-black' },
    { label: t('stepResolved'), icon: CheckCircle2, activeColor: 'text-slate-400 bg-slate-900 border-slate-700' }
  ];

  const getStageTimestamp = (stepIndex: number) => {
    if (!activeAlert) return '--:--';
    const baseTime = new Date(activeAlert.createdAt).getTime();

    // Chronological minute offsets matching real event log sequence
    const offsets = [0, 1, 2, 3, 6, 10];
    
    if (currentStep >= stepIndex) {
      if (stepIndex === 5 && activeAlert.resolvedAt) {
        return new Date(activeAlert.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      const t = new Date(baseTime + offsets[stepIndex] * 60 * 1000);
      return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '--:--';
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md">
      
      {/* Standby View */}
      {!activeAlert && (
        <div className="text-center py-2.5">
          <div className="flex items-center justify-center space-x-2 text-xs font-black text-slate-100 uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-slate-50 font-black drop-shadow-md">{t('telemetryStreamConnected')}</span>
          </div>
        </div>
      )}

      {/* Active Stepper UI */}
      {activeAlert && (
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2">
          
          {/* Background Line Connector (Horizontal for Desktop) */}
          <div className="hidden md:block absolute left-8 right-8 top-[20px] h-[2px] bg-slate-800 z-0" />
          
          {/* Foreground Colored Line Connector (Horizontal for Desktop) */}
          <div 
            style={{ width: `${currentStep >= 0 ? (currentStep / (steps.length - 1)) * 100 : 0}%` }}
            className="hidden md:block absolute left-8 right-8 top-[20px] h-[2px] bg-gradient-to-r from-red-500 via-amber-500 via-blue-500 to-emerald-500 transition-all duration-1000 z-0" 
          />

          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isCurrent = idx === currentStep;
            const isCompleted = idx < currentStep;
            const timeStr = getStageTimestamp(idx);
            
            return (
              <div key={idx} className="relative z-10 flex flex-row md:flex-col items-center w-full md:w-auto md:text-center space-x-3.5 md:space-x-0 md:space-y-2">
                
                {/* Node Circle */}
                <div 
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-700 ${
                    isCurrent 
                      ? step.activeColor + ' ring-4 ring-slate-800 scale-110 shadow-lg shadow-red-500/20' 
                      : isCompleted 
                        ? 'bg-slate-900 border-slate-700 text-slate-300'
                        : 'bg-slate-950 border-slate-900 text-slate-600'
                  }`}
                >
                  <StepIcon className="h-4.5 w-4.5" />
                </div>

                {/* Node Labels and Timestamps */}
                <div className="flex flex-col md:items-center">
                  <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
                    isCurrent 
                      ? 'text-slate-200 font-black' 
                      : isCompleted 
                        ? 'text-slate-400' 
                        : 'text-slate-600'
                  }`}>
                    {step.label}
                  </span>
                  
                  {/* Timestamp Display */}
                  <span className={`text-[9px] font-semibold font-mono mt-0.5 transition-colors ${
                    isCurrent 
                      ? 'text-amber-400' 
                      : isCompleted 
                        ? 'text-slate-500' 
                        : 'text-slate-750'
                  }`}>
                    {timeStr}
                  </span>
                </div>

              </div>
            );
          })}

        </div>
      )}
    </div>
  );
};
