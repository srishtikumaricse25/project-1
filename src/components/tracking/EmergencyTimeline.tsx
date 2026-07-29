import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, MapPin, MessageSquare, Mail, UserCheck, Compass } from 'lucide-react';
import { EmergencyAlert, AlertTimelineEvent } from '../../types';
import { useI18n } from '../../services/i18n';

interface EmergencyTimelineProps {
  activeAlert: EmergencyAlert | null;
}

export const EmergencyTimeline: React.FC<EmergencyTimelineProps> = ({ activeAlert }) => {
  const { t } = useI18n();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const triggerTime = activeAlert ? new Date(activeAlert.createdAt) : null;

  // Live elapsed time counter when alert is active
  useEffect(() => {
    if (!activeAlert) {
      setElapsedSeconds(0);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const start = new Date(activeAlert.createdAt).getTime();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeAlert]);
  
  const formatOffsetTimeMinutes = (minutes: number) => {
    if (!triggerTime) return '--:--';
    const t = new Date(triggerTime.getTime() + minutes * 60 * 1000);
    return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatElapsed = () => {
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStepStatus = (index: number): 'COMPLETED' | 'CURRENT' | 'PENDING' => {
    if (!activeAlert) return 'PENDING';

    const status = activeAlert.status;
    switch (index) {
      case 0: // SOS Triggered
      case 1: // Contacts Notified
        return 'COMPLETED';
      
      case 2: // Waiting for Acknowledgement
        if (status === 'ACTIVE') return 'CURRENT';
        return 'COMPLETED';
      
      case 3: // Responder Assigned
        if (status === 'ACTIVE') return 'PENDING';
        if (status === 'ACCEPTED') return 'CURRENT';
        return 'COMPLETED';
      
      case 4: // Responder En Route
        if (['ACTIVE', 'ACCEPTED'].includes(status)) return 'PENDING';
        if (['NAVIGATING', 'DISPATCHED'].includes(status)) return 'CURRENT';
        return 'COMPLETED';
      
      case 5: // Reached Location
        if (['ACTIVE', 'ACCEPTED', 'NAVIGATING', 'DISPATCHED'].includes(status)) return 'PENDING';
        if (status === 'ARRIVED') return 'CURRENT';
        return 'COMPLETED';
      
      case 6: // Incident Resolved
        if (status === 'RESOLVED' || status === 'FALSE_ALARM') return 'COMPLETED';
        if (status === 'ARRIVED') return 'CURRENT';
        return 'PENDING';
      
      default:
        return 'PENDING';
    }
  };

  

  const [timeline, setTimeline] = useState<AlertTimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeline when activeAlert changes
  useEffect(() => {
    if (!activeAlert) return;
    setLoading(true);
    fetch(`/api/alerts/${activeAlert.id}/timeline`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch timeline');
        return res.json();
      })
      .then((data) => {
        setTimeline(data);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeAlert]);

  const iconForLabel = (label: string) => {
    switch (label) {
      case 'SOS Triggered':
        return <AlertCircle className="h-4 w-4" />;
      case 'GPS Captured':
        return <MapPin className="h-4 w-4" />;
      case 'SMS Sent':
        return <MessageSquare className="h-4 w-4" />;
      case 'Email Sent':
        return <Mail className="h-4 w-4" />;
      case 'Brother Accepted':
        return <UserCheck className="h-4 w-4" />;
      case 'Tracking Active':
        return <Compass className="h-4 w-4" />;
      case 'Resolved':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  // Render timeline items
  const renderTimeline = () => {
    if (loading) {
      return <div className="text-sm text-slate-400">Loading timeline...</div>;
    }
    if (error) {
      return <div className="text-sm text-red-500">Error: {error}</div>;
    }
    if (!timeline.length) {
      return <div className="text-sm text-slate-400">No timeline data available.</div>;
    }
    return timeline.map((event, idx) => {
      const timeStr = new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isLast = idx === timeline.length - 1;
      const nextStatus = idx < timeline.length - 1 ? 'COMPLETED' : 'PENDING'; // All shown as completed
      const lineColor = 'bg-emerald-500';
      return (
        <div key={idx} className="relative flex">
          {/* Left Column */}
          <div className="flex flex-col items-center mr-4" style={{ width: '28px' }}>
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 bg-emerald-500/15 border-emerald-500 text-emerald-500">
              {iconForLabel(event.label)}
            </div>
            {!isLast && (
              <div className={`w-0.5 flex-1 min-h-[22px] ${lineColor}`} />
            )}
          </div>
          {/* Right Column */}
          <div className={`flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-xs font-bold tracking-tight text-emerald-400">{event.label}</h4>
                <p className="text-[10px] mt-0.5 leading-relaxed text-emerald-500/90 font-medium">{timeStr}</p>
              </div>
              <div className="flex-shrink-0">
                <span className="inline-flex items-center space-x-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-1 rounded-lg">
                  {timeStr}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  // Remove previous static steps logic; use timeline for rendering


  const completedCount = timeline.length;
  const progressPct = timeline.length > 0 ? 100 : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl backdrop-blur-md space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Clock className={`h-4.5 w-4.5 ${activeAlert ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {t('emergencyTimelineTitle')}
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          {activeAlert && (
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
              ⏱ {formatElapsed()}
            </span>
          )}
          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
            activeAlert 
              ? 'text-red-400 bg-red-500/10 border border-red-500/20' 
              : 'text-slate-500 bg-slate-800 border border-slate-700'
          }`}>
            {activeAlert ? t('liveText') : t('standbyText')}
          </span>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {activeAlert && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider">{t('overallProgressLabel')}</span>
            <span className="font-bold text-emerald-400">{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Timeline Steps */}
      <div className="relative ml-3.5 py-1">
        {renderTimeline()}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-5 pt-2 border-t border-slate-800/60">
        <div className="flex items-center space-x-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-slate-400 font-semibold">{t('completedLegend')}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-semibold">{t('currentLegend')}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
          <span className="text-[10px] text-slate-400 font-semibold">{t('pendingLegend')}</span>
        </div>
      </div>

    </div>
  );
};
