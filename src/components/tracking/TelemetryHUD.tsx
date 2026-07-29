import React from 'react';
import { Navigation, Battery, Mic, Compass, Gauge, Clock, ShieldAlert, Share2, MapPin } from 'lucide-react';
import { GeoLocation } from '../../types';
import { useI18n } from '../../services/i18n';

interface TelemetryHUDProps {
  location: GeoLocation;
  batteryLevel: number;
  ambientAudio: boolean;
  contactsNotified: number;
  trackingToken?: string;
  onCopyShareLink?: () => void;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  location,
  batteryLevel,
  ambientAudio,
  contactsNotified,
  trackingToken,
  onCopyShareLink
}) => {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-xl">
      
      {/* Current Address & Location */}
      <div className="col-span-2 sm:col-span-4 lg:col-span-2 flex items-center space-x-3 rounded-xl bg-slate-950/70 p-3 border border-slate-800">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="overflow-hidden">
          <div className="text-[10px] uppercase font-bold text-slate-400">{t('currentPos')}</div>
          <div className="text-xs font-semibold text-white truncate" title={location.address}>
            {location.address || `${location.lat.toFixed(4)}°, ${location.lng.toFixed(4)}°`}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {t('latLabel')}: {location.lat.toFixed(5)} | {t('lngLabel')}: {location.lng.toFixed(5)}
          </div>
        </div>
      </div>

      {/* Battery Level */}
      <div className="flex items-center space-x-3 rounded-xl bg-slate-950/70 p-3 border border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Battery className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">{t('battery')}</div>
          <div className="text-sm font-black text-slate-100">{batteryLevel}%</div>
        </div>
      </div>

      {/* Speed & Heading */}
      <div className="flex items-center space-x-3 rounded-xl bg-slate-950/70 p-3 border border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Gauge className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">{t('speed')}</div>
          <div className="text-xs font-bold text-slate-100">
            {location.speed ? `${(location.speed * 3.6).toFixed(1)} km/h` : t('stationary')}
          </div>
        </div>
      </div>

      {/* Ambient Audio Monitor Status */}
      <div className="flex items-center space-x-3 rounded-xl bg-slate-950/70 p-3 border border-slate-800">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${ambientAudio ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
          <Mic className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400">{t('ambientAudio')}</div>
          <div className="text-xs font-bold text-slate-100">
            {ambientAudio ? <span className="text-red-400">{t('recording')}</span> : t('muted')}
          </div>
        </div>
      </div>

      {/* Contacts Notified & Share Link */}
      <div className="flex items-center space-x-3 rounded-xl bg-slate-950/70 p-3 border border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-[10px] uppercase font-bold text-slate-400">{t('notifiedContacts')}</div>
          <div className="text-xs font-bold text-slate-100">{contactsNotified} {t('contacts')}</div>
        </div>
        {onCopyShareLink && trackingToken && (
          <button
            onClick={onCopyShareLink}
            title={t('copyShareLinkTitle')}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Share2 className="h-4 w-4 text-emerald-400" />
          </button>
        )}
      </div>

    </div>
  );
};
