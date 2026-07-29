import React from 'react';
import { PhoneCall, Shield, HeartPulse, Building2 } from 'lucide-react';
import { useI18n } from '../../services/i18n';

export const EmergencyHotlines: React.FC = () => {
  const { t } = useI18n();
  const hotlines = [
    { title: t('police'), number: '112', desc: 'National Helpline', icon: Shield, color: 'from-blue-600 to-indigo-800' },
    { title: t('hospital'), number: '108', desc: '24/7 Medical Dispatch', icon: HeartPulse, color: 'from-emerald-600 to-teal-800' },
    { title: t('womenSafetyHelplineTitle'), number: '1091', desc: 'Discreet Helpline', icon: PhoneCall, color: 'from-rose-600 to-pink-800' },
    { title: t('campusSecurityTitle'), number: '+1-555-911-0000', desc: 'Mock Response Desk', icon: Building2, color: 'from-purple-600 to-violet-800' }
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl">
      <h3 className="text-sm font-bold text-white mb-3">{t('directEmergencyHotlinesTitle')}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hotlines.map((h, i) => {
          const Icon = h.icon;
          return (
            <a
              key={i}
              href={`tel:${h.number}`}
              onClick={(e) => {
                const proceed = window.confirm(t('dialConfirmationText').replace('{title}', h.title).replace('{number}', h.number));
                if (!proceed) e.preventDefault();
              }}
              className={`group flex items-center space-x-3 rounded-2xl bg-gradient-to-br ${h.color} p-3 text-white shadow-lg transition-all active:scale-95 hover:shadow-xl hover:brightness-105 border border-white/10 cursor-pointer`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md group-hover:scale-105 transition-transform">
                <Icon className="h-5 w-5" />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-[11px] font-bold tracking-tight truncate">{h.title}</div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-xs font-mono font-black">{h.number}</span>
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-white/80 bg-white/10 px-1.5 py-0.2 rounded border border-white/5 group-hover:bg-white/25 transition-all">
                    {t('tapToCallLabel')}
                  </span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
