import React, { useState } from 'react';
import { Navigation, Footprints, Car, Pause, Radio, Settings, ShieldAlert, Cpu } from 'lucide-react';
import { GeoLocation } from '../../types';
import { useI18n } from '../../services/i18n';

interface GpsSimulatorProps {
  mode: 'REAL' | 'WALK' | 'DRIVE' | 'STATIONARY';
  setMode: (mode: 'REAL' | 'WALK' | 'DRIVE' | 'STATIONARY') => void;
  location: GeoLocation;
}

export const GpsSimulator: React.FC<GpsSimulatorProps> = ({ mode, setMode, location }) => {
  const { t } = useI18n();
  const [showDevPanel, setShowDevPanel] = useState(false);

  const getSourceLabel = (m: string) => {
    switch (m) {
      case 'REAL':
        return t('html5ApiLabel');
      case 'WALK':
        return t('devWalkLabel');
      case 'DRIVE':
        return t('devDriveLabel');
      case 'STATIONARY':
        return t('devFixedLabel');
      default:
        return t('unknown');
    }
  };

  const isSimulated = mode !== 'REAL';

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 backdrop-blur-md space-y-4">
      {/* Professional GPS Status Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cpu className="h-4.5 w-4.5 text-red-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {t('systemTelemetryHeader')}
          </h3>
        </div>

        {/* Developer settings toggle button */}
        <button
          onClick={() => setShowDevPanel(!showDevPanel)}
          title={t('toggleDevToolsTitle')}
          className={`p-1.5 rounded-lg border transition-colors ${
            showDevPanel
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Professional Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800/60">
        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase">{t('gpsStatusLabel')}</div>
          <div className="flex items-center space-x-1.5 mt-1">
            <span className={`h-2 w-2 rounded-full ${isSimulated ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className={`text-xs font-bold ${isSimulated ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isSimulated ? t('demoModeActiveLabel') : t('gpsConnectedLabel')}
            </span>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase">{t('gpsAccuracyLabel')}</div>
          <div className="text-xs font-mono font-bold text-cyan-400 mt-1">
            ±{location.accuracy || 8} {t('metersSuffix')}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase">{t('lastUpdatedLabel')}</div>
          <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
            {new Date(location.timestamp).toLocaleTimeString()}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 font-bold uppercase">{t('gpsSourceLabel')}</div>
          <div className="text-xs font-bold text-cyan-400 mt-1 truncate" title={getSourceLabel(mode)}>
            {mode === 'REAL' ? t('html5ApiShort') : t('demoModeActiveLabel')}
          </div>
        </div>
      </div>

      {/* Hidden Developer Demo Mode Options Panel */}
      {showDevPanel && (
        <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-fadeIn">
          <div className="flex items-center space-x-2 text-[11px] font-bold text-amber-400">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>{t('devModeOverrideTitle')}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMode('REAL')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === 'REAL'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>{t('realDeviceGpsBtn')}</span>
            </button>

            <button
              onClick={() => setMode('WALK')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === 'WALK'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>{t('simulateWalkingBtn')}</span>
            </button>

            <button
              onClick={() => setMode('DRIVE')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === 'DRIVE'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Car className="h-3.5 w-3.5" />
              <span>{t('simulateDrivingBtn')}</span>
            </button>

            <button
              onClick={() => setMode('STATIONARY')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === 'STATIONARY'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Pause className="h-3.5 w-3.5" />
              <span>{t('holdFixedBtn')}</span>
            </button>
          </div>
          
          <p className="text-[10px] text-slate-500 leading-normal">
            {t('demoModeWarningText')}
          </p>
        </div>
      )}
    </div>
  );
};
