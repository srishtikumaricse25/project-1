import React, { useState, useEffect } from 'react';
import { ShieldCheck, Wifi, Battery, Users, Timer, Info, CloudSun, Compass, Clock } from 'lucide-react';
import { useI18n } from '../../services/i18n';

interface SafetyReadinessProps {
  gpsConnected: boolean;
  contactsCount: number;
  checkInActive: boolean;
  batteryLevel: number;
  gpsAccuracy?: number;
  lastAlertInfo?: string;
}

export const SafetyReadiness: React.FC<SafetyReadinessProps> = ({
  gpsConnected,
  contactsCount,
  checkInActive,
  batteryLevel,
  gpsAccuracy = 8,
  lastAlertInfo
}) => {
  const { t } = useI18n();
  const isOnline = navigator.onLine;
  const lastAlertText = lastAlertInfo || t('noPastIncidentsText');

  // Live Updating Time & Date State
  const [liveDateTime, setLiveDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate dynamic readiness score
  let score = 0;
  if (gpsConnected) score += 25;
  if (contactsCount >= 3) score += 35;
  else if (contactsCount > 0) score += 20;
  if (batteryLevel >= 50) score += 25;
  else if (batteryLevel > 15) score += 15;
  if (isOnline) score += 15;

  const getScoreColor = (s: number) => {
    if (s >= 85) return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (s >= 50) return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
    return 'text-red-500 border-red-500/30 bg-red-500/10';
  };

  const getBatteryIconColor = (level: number) => {
    if (level <= 15) return 'text-red-500 animate-pulse';
    if (level <= 35) return 'text-amber-500';
    return 'text-slate-500';
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {t('readinessIndexHeader')}
          </h3>
        </div>
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getScoreColor(score)}`}>
          {score}% {t('readinessScoreSuffix')}
        </div>
      </div>

      {/* Metrics List */}
      <div className="space-y-2.5">
        
        {/* Date and Time (Live Updating) */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-400">{t('currentTimeLabel')}</span>
          </div>
          <span className="font-bold text-slate-200">
            {liveDateTime.toLocaleDateString()} {liveDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* GPS */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${gpsConnected ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
            <span className="font-semibold text-slate-400">{t('gpsStatusLabel')}</span>
          </div>
          <span className={`font-bold ${gpsConnected ? 'text-emerald-400' : 'text-red-400'}`}>
            {gpsConnected ? t('gpsConnectedText') : t('gpsDisconnectedText')}
          </span>
        </div>

        {/* GPS Accuracy Indicator */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2">
            <Compass className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-400">{t('gpsAccuracyLabel')}</span>
          </div>
          <span className="font-bold text-cyan-400">
            ±{gpsAccuracy}m
          </span>
        </div>

        {/* Internet Status */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2">
            <Wifi className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-400">{t('internetLinkLabel')}</span>
          </div>
          <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
            {isOnline ? t('internetOnlineText') : t('internetOfflineText')}
          </span>
        </div>

        {/* Battery with dynamic icon color */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2">
            <Battery className={`h-3.5 w-3.5 ${getBatteryIconColor(batteryLevel)}`} />
            <span className="font-semibold text-slate-400">{t('battery')}</span>
          </div>
          <span className={`font-bold ${batteryLevel <= 15 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
            {batteryLevel}%
          </span>
        </div>

        {/* Weather Indicator */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2">
            <CloudSun className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-400">{t('currentWeatherLabel')}</span>
          </div>
          <span className="font-bold text-slate-200">
            {t('weatherClearText')}
          </span>
        </div>

        {/* Contacts */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-400">{t('trustedRosterLabel')}</span>
          </div>
          <span className={`font-bold ${contactsCount >= 3 ? 'text-emerald-400' : contactsCount > 0 ? 'text-amber-400' : 'text-red-400'}`}>
            {contactsCount === 0 ? t('trustedRosterSetup') : `${contactsCount} ${t('trustedRosterVerified')}`}
          </span>
        </div>

        {/* Check-in Timer */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2">
            <Timer className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-400">{t('checkinTimerLabel')}</span>
          </div>
          <span className={`font-bold ${checkInActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
            {checkInActive ? t('activeMonitorText') : t('inactiveText')}
          </span>
        </div>

        {/* Last Emergency Alert Information */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-xs">
          <div className="flex items-center space-x-2">
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-semibold text-slate-400">{t('lastIncidentLabel')}</span>
          </div>
          <span className="font-bold text-slate-300 truncate max-w-[160px]" title={lastAlertText}>
            {lastAlertText}
          </span>
        </div>

      </div>

      {/* Warning Alert if score is low */}
      {score < 85 && (
        <div className="flex items-start space-x-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-[10px] text-amber-400 leading-normal">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            {t('readinessWarningText')}
          </span>
        </div>
      )}

    </div>
  );
};
