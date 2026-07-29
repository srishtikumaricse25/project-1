import React, { useEffect, useState } from 'react';
import { Smartphone, Laptop, Monitor, Globe, X, Trash2, LogOut, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useI18n } from '../../services/i18n';

interface UserDevice {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress?: string;
  lastLogin: string;
  isTrusted: boolean;
}

interface MyDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyDevicesModal: React.FC<MyDevicesModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sos-session-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/devices', { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDevices(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Error fetching devices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
      setActionMsg('');
    }
  }, [isOpen]);

  const handleRemoveDevice = async (id: string) => {
    try {
      const token = localStorage.getItem('sos-session-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/devices/${id}`, { method: 'DELETE', headers, credentials: 'include' });
      if (res.ok) {
        setDevices(prev => prev.filter(d => d.id !== id));
        setActionMsg('Device revoked successfully.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoutOthers = async () => {
    try {
      const token = localStorage.getItem('sos-session-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/devices/logout-others', { method: 'POST', headers, credentials: 'include' });
      if (res.ok) {
        setActionMsg('All other session devices logged out.');
        fetchDevices();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">{t('myActiveDevices')}</h2>
              <p className="text-[11px] text-slate-400">{t('manageActiveDevicesSub')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {actionMsg && (
          <div className="flex items-center space-x-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{actionMsg === 'Device revoked successfully.' ? t('deviceRevokedMsg') : actionMsg === 'All other session devices logged out.' ? t('allOtherLoggedOutMsg') : actionMsg}</span>
          </div>
        )}

        {/* Devices List */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 flex justify-center items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{t('fetchingDevices')}</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">{t('noActiveDevicesFound')}</div>
          ) : (
            devices.map(dev => (
              <div key={dev.id} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-850">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-slate-300 border border-slate-800">
                    {dev.os.toLowerCase().includes('windows') || dev.os.toLowerCase().includes('mac') ? (
                      <Monitor className="h-4 w-4" />
                    ) : (
                      <Smartphone className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{dev.deviceName}</span>
                      {dev.isTrusted && (
                        <span className="flex items-center space-x-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <ShieldCheck className="h-3 w-3" />
                          <span>{t('trustedBadge')}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {dev.browser} • {dev.os} • {dev.ipAddress || '127.0.0.1'}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {t('lastActiveLabel')} {new Date(dev.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveDevice(dev.id)}
                  title="Revoke Device"
                  className="rounded-xl p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={handleLogoutOthers}
            className="flex items-center space-x-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2 text-xs font-semibold text-red-400 border border-red-500/20 transition-all active:scale-95"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('logoutOtherDevicesBtn')}</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            {t('closeBtn')}
          </button>
        </div>

      </div>
    </div>
  );
};
