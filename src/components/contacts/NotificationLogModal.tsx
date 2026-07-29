import React from 'react';
import { Bell, MessageSquare, Mail, CheckCircle2, X } from 'lucide-react';
import { NotificationLog } from '../../types';
import { useI18n } from '../../services/i18n';

interface NotificationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: NotificationLog[];
}

export const NotificationLogModal: React.FC<NotificationLogModalProps> = ({
  isOpen,
  onClose,
  logs
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[85vh] flex flex-col">
        
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-white font-bold text-base">
            <Bell className="h-5 w-5 text-red-500" />
            <span>{t('emergencyDispatchNotificationLog')}</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">{t('noNotificationsLogged')}</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      log.channel === 'SMS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {log.channel === 'SMS' ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </span>
                    <span className="font-bold text-sm text-white">{log.contactName}</span>
                    <span className="text-xs text-slate-400 font-mono">({log.recipient})</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{log.status}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900 p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap border border-slate-800/80">
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>{t('gatewaySmtpDetails')}</span>
          <button onClick={onClose} className="rounded-xl bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700 font-semibold">
            {t('closeBtn')}
          </button>
        </div>

      </div>
    </div>
  );
};
