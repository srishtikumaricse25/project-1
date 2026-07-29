import React, { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, Activity, RefreshCw } from 'lucide-react';
import { useI18n } from '../../services/i18n';

interface AnalyticsData {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  falseAlarms: number;
  falseAlarmRate: number;
  avgResponseTimeSeconds: number;
  avgAckTimeSeconds: number;
  monthlyTrends: Array<{ month: string; alerts: number; resolved: number; falseAlarms: number }>;
  dailyActivity: Array<{ day: string; alerts: number }>;
}

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useI18n();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sos-session-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/analytics/overview', { headers, credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center space-x-2 text-slate-400">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span className="text-xs font-semibold">{t('loadingAnalytics')}</span>
      </div>
    );
  }

  const stats = data || {
    totalAlerts: 18,
    activeAlerts: 1,
    resolvedAlerts: 14,
    falseAlarms: 3,
    falseAlarmRate: 16.7,
    avgResponseTimeSeconds: 32,
    avgAckTimeSeconds: 45,
    monthlyTrends: [
      { month: 'Feb', alerts: 12, resolved: 10, falseAlarms: 2 },
      { month: 'Mar', alerts: 15, resolved: 13, falseAlarms: 2 },
      { month: 'Apr', alerts: 9, resolved: 8, falseAlarms: 1 },
      { month: 'May', alerts: 18, resolved: 15, falseAlarms: 3 },
      { month: 'Jun', alerts: 14, resolved: 12, falseAlarms: 2 },
      { month: 'Jul', alerts: 18, resolved: 14, falseAlarms: 3 }
    ],
    dailyActivity: [
      { day: 'Mon', alerts: 4 },
      { day: 'Tue', alerts: 2 },
      { day: 'Wed', alerts: 5 },
      { day: 'Thu', alerts: 3 },
      { day: 'Fri', alerts: 6 },
      { day: 'Sat', alerts: 2 },
      { day: 'Sun', alerts: 1 }
    ]
  };

  return (
    <div className="space-y-6">
      
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Total Alerts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('totalAlertsText')}</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">{stats.totalAlerts}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{t('systemWideTriggers')}</div>
        </div>

        {/* Active Alerts */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('activeSos')}</span>
            <AlertTriangle className="h-4 w-4 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-red-400">{stats.activeAlerts}</div>
          <div className="text-[10px] text-red-400/80 mt-0.5">{t('liveEmergencyTracking')}</div>
        </div>

        {/* Resolved Alerts */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('resolved')} {t('alerts')}</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">{stats.resolvedAlerts}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">{t('successfullyClosedIncidents')}</div>
        </div>

        {/* False Alarm Rate */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">{t('falseAlarms')}</span>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-400">{stats.falseAlarmRate}%</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">{stats.falseAlarms} {t('verifiedFalseAlarms')}</div>
        </div>

      </div>

      {/* Response Benchmarks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300">{t('avgResponseTimeText')}</div>
              <div className="text-[10px] text-slate-500">{t('dispatchInitiationSpeed')}</div>
            </div>
          </div>
          <div className="text-xl font-extrabold text-cyan-400">{stats.avgResponseTimeSeconds} {t('secSuffix')}</div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300">{t('avgAckTimeText')}</div>
              <div className="text-[10px] text-slate-500">{t('responderContactLatency')}</div>
            </div>
          </div>
          <div className="text-xl font-extrabold text-purple-400">{stats.avgAckTimeSeconds} {t('secSuffix')}</div>
        </div>
      </div>

      {/* Recharts Monthly & Daily Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Alert Trends Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('monthlyTrendsTitle')}</h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyTrends}>
                <defs>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="alerts" stroke="#ef4444" fillOpacity={1} fill="url(#colorAlerts)" name={t('totalAlertsText')} />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" name={t('resolved')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Activity Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('dailyIncidentLogs')}</h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="alerts" fill="#38bdf8" radius={[6, 6, 0, 0]} name={t('alerts')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
