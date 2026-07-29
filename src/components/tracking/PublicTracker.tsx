import React, { useEffect, useState } from 'react';
import { ShieldAlert, Phone, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { LiveMap } from './LiveMap';
import { TelemetryHUD } from './TelemetryHUD';
import { EmergencyAlert } from '../../types';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { useI18n } from '../../services/i18n';

interface PublicTrackerProps {
  token: string;
  onClose?: () => void;
}

export const PublicTracker: React.FC<PublicTrackerProps> = ({ token, onClose }) => {
  const { t } = useI18n();
  const [alert, setAlert] = useState<EmergencyAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAlertData = async () => {
    try {
      setLoading(true);
      const data = await api.getAlertByToken(token);
      setAlert(data);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Invalid or expired emergency tracking token.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertData();

    // Connect socket to receive real-time location stream for this token's alert
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!alert) return;

    socketService.joinAlertRoom(alert.id);

    socketService.onLocationUpdated(({ alertId, location, batteryLevel }) => {
      if (alertId === alert.id) {
        setAlert(prev => prev ? {
          ...prev,
          location,
          batteryLevel,
          breadcrumbs: [...prev.breadcrumbs, location]
        } : prev);
      }
    });

    socketService.onStatusChanged(({ alertId, status }) => {
      if (alertId === alert.id) {
        setAlert(prev => prev ? { ...prev, status: status as any } : prev);
      }
    });

    return () => {
      socketService.leaveAlertRoom(alert.id);
    };
  }, [alert?.id]);

  if (loading) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center space-y-3 bg-slate-950 text-slate-300">
        <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
        <span className="text-sm font-semibold">{t('connectingSosStreamText')}</span>
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="mx-auto my-12 max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-white backdrop-blur-xl">
        <ShieldAlert className="mx-auto h-14 w-14 text-red-500 mb-3" />
        <h2 className="text-xl font-bold">{t('trackingUnavailableTitle')}</h2>
        <p className="mt-2 text-sm text-red-300">{error || 'Alert token expired or de-activated.'}</p>
        {onClose && (
          <button onClick={onClose} className="mt-6 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold hover:bg-slate-700">
            {t('returnMainPortalBtn')}
          </button>
        )}
      </div>
    );
  }

  const isResolved = alert.status === 'RESOLVED' || alert.status === 'FALSE_ALARM';

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6">
      
      {/* Top Banner Alert Notice */}
      <div className={`rounded-3xl p-6 border shadow-2xl backdrop-blur-xl ${
        isResolved
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-red-600/15 border-red-500/40 text-red-200'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              isResolved ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-pulse'
            }`}>
              {isResolved ? <CheckCircle2 className="h-8 w-8" /> : <ShieldAlert className="h-8 w-8" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  {t('liveEmergencyTrackerTitle')} {alert.userName}
                </h1>
                <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                  isResolved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {alert.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                {t('triggeredAtText')} {new Date(alert.createdAt).toLocaleTimeString()} ({new Date(alert.createdAt).toLocaleDateString()})
              </p>
            </div>
          </div>

          {/* Quick Action Dialers for Emergency Contact */}
          <div className="flex items-center space-x-2">
            <a
              href={`tel:${alert.userPhone}`}
              className="flex items-center space-x-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-red-500 transition-all"
            >
              <Phone className="h-4 w-4" />
              <span>{t('callUserBtn')} ({alert.userPhone})</span>
            </a>
          </div>
        </div>
      </div>

      {/* Live Map */}
      <LiveMap
        location={alert.location}
        breadcrumbs={alert.breadcrumbs}
        userName={alert.userName}
        isEmergency={!isResolved}
        height="500px"
      />

      {/* Telemetry HUD */}
      <TelemetryHUD
        location={alert.location}
        batteryLevel={alert.batteryLevel}
        ambientAudio={alert.ambientAudioRecorded}
        contactsNotified={alert.contactsNotifiedCount}
        trackingToken={alert.trackingToken}
      />

    </div>
  );
};
