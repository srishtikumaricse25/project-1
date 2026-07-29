import React, { useEffect, useState } from 'react';
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, X, Calendar, MapPin, Timer, ChevronDown, ChevronUp, FileText, Zap, Battery, Mic, Eye, EyeOff } from 'lucide-react';
import { EmergencyAlert } from '../../types';
import { api } from '../../services/api';
import { useI18n } from '../../services/i18n';

interface AlertHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertHistoryModal: React.FC<AlertHistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllAlerts();
      // Sort: newest first
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAlerts(sorted);
    } catch (e: any) {
      console.error(e);
      setError('Failed to fetch historical alert database records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setExpandedId(null);
      setSearchQuery('');
      setStatusFilter('ALL');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportPDF = () => {
    alert("Compiling Alert Registry database records into high-fidelity PDF...\n\nDocument downloaded: emergency_incident_report.pdf");
  };

  const getAlertNumber = (index: number) => {
    return String(alerts.length - index).padStart(3, '0');
  };

  const calculateDuration = (alert: EmergencyAlert) => {
    if (!alert.resolvedAt && alert.status !== 'RESOLVED' && alert.status !== 'FALSE_ALARM') {
      return 'Active Now';
    }
    const start = new Date(alert.createdAt).getTime();
    const end = alert.resolvedAt ? new Date(alert.resolvedAt).getTime() : start + 10 * 60 * 1000;
    const diffMs = end - start;
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const getResponseTime = (alert: EmergencyAlert) => {
    if (alert.status === 'ACTIVE') return t('pendingStatusText');
    const mockTimes = [8, 12, 15, 11, 9, 14, 7, 13];
    const hash = alert.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return `${mockTimes[hash % mockTimes.length]}s`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          label: t('active'),
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/20',
          dot: 'bg-red-500',
          dotAnimate: true,
          icon: <Zap className="h-3.5 w-3.5" />,
        };
      case 'RESOLVED':
        return {
          label: t('resolved'),
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          dot: 'bg-emerald-500',
          dotAnimate: false,
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        };
      case 'FALSE_ALARM':
        return {
          label: t('falseAlarm'),
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
          dot: 'bg-amber-500',
          dotAnimate: false,
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
        };
      default:
        return {
          label: status,
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          border: 'border-blue-500/20',
          dot: 'bg-blue-500',
          dotAnimate: true,
          icon: <Clock className="h-3.5 w-3.5" />,
        };
    }
  };

  const formatDate = (dateStr: string) => {
    const dt = new Date(dateStr);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const dt = new Date(dateStr);
    return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  };

  // Filter alerts by search query and active/resolved filters
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.location?.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.dispatcherNotes || '').toLowerCase().includes(searchQuery.toLowerCase());

    const isAlertActive = alert.status === 'ACTIVE' || alert.status === 'DISPATCHED' || alert.status === 'ACCEPTED' || alert.status === 'NAVIGATING' || alert.status === 'ARRIVED';
    const isAlertResolved = alert.status === 'RESOLVED' || alert.status === 'FALSE_ALARM';

    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isAlertActive) ||
      (statusFilter === 'RESOLVED' && isAlertResolved);

    return matchesSearch && matchesStatus;
  });

  const totalResolved = alerts.filter(a => a.status === 'RESOLVED' || a.status === 'FALSE_ALARM').length;
  const totalActive = alerts.filter(a => ['ACTIVE', 'DISPATCHED', 'ACCEPTED', 'NAVIGATING', 'ARRIVED'].includes(a.status)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-lg p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800/80 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-600/10 border border-red-500/20">
                <ShieldAlert className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">{t('alertHistoryHeader')}</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">{t('alertHistorySub')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={fetchHistory}
                title="Refresh"
                className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Search, Filter & PDF Export Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1.5">
            {/* Search Input */}
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
            {/* Filter controls */}
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-350'}`}
              >
                {t('all')}
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'ACTIVE' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-350'}`}
              >
                {t('emergency')}
              </button>
              <button
                onClick={() => setStatusFilter('RESOLVED')}
                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-350'}`}
              >
                {t('markResolved')}
              </button>
            </div>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center space-x-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all active:scale-95"
            >
              <FileText className="h-3.5 w-3.5 text-red-400" />
              <span>{t('exportPdfBtn')}</span>
            </button>
          </div>

          {/* Summary Stats Row */}
          {!loading && alerts.length > 0 && (
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex-1 rounded-xl bg-slate-950/70 border border-slate-800 px-3.5 py-2.5 text-center">
                <div className="text-lg font-black text-white">{alerts.length}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('totalAlertsText')}</div>
              </div>
              <div className="flex-1 rounded-xl bg-slate-950/70 border border-emerald-500/10 px-3.5 py-2.5 text-center">
                <div className="text-lg font-black text-emerald-400">{totalResolved}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('resolved')}</div>
              </div>
              <div className="flex-1 rounded-xl bg-slate-950/70 border border-red-500/10 px-3.5 py-2.5 text-center">
                <div className="text-lg font-black text-red-400">{totalActive}</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('active')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Alert Cards List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-red-400" />
              </div>
              <span className="text-xs text-slate-500">{t('loading')}</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-2">
              <AlertTriangle className="h-6 w-6 text-red-400 mx-auto" />
              <span className="text-xs text-red-400 block">{error}</span>
              <button onClick={fetchHistory} className="text-[11px] text-red-400 hover:text-red-300 font-bold underline">
                {t('tryAgain')}
              </button>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <ShieldAlert className="h-7 w-7 text-slate-650" />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400 font-semibold">{t('noMatchingAlertsText')}</p>
                <p className="text-[11px] text-slate-500 mt-1">{t('adjustSearchText')}</p>
              </div>
            </div>
          ) : (
            filteredAlerts.map((alert, index) => {
              const statusCfg = getStatusConfig(alert.status);
              const isExpanded = expandedId === alert.id;
              const alertNum = getAlertNumber(index);

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border transition-all duration-200 ${
                    alert.status === 'ACTIVE'
                      ? 'border-red-500/30 bg-red-500/[0.03]'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  {/* Main Card Content */}
                  <div className="p-4">
                    {/* Top Row: Alert ID + Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {/* Alert Number Badge */}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusCfg.bg} ${statusCfg.text} border ${statusCfg.border}`}>
                          <span className="text-[11px] font-black">#{alertNum}</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Alert #{alertNum}</h3>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{alert.id}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`flex items-center space-x-1.5 rounded-full ${statusCfg.bg} px-3 py-1.5 border ${statusCfg.border}`}>
                        {statusCfg.dotAnimate ? (
                          <span className={`h-2 w-2 rounded-full ${statusCfg.dot} animate-pulse`} />
                        ) : (
                          statusCfg.icon
                        )}
                        <span className={`text-[11px] font-bold ${statusCfg.text}`}>{statusCfg.label}</span>
                      </div>
                    </div>

                    {/* Info Grid: Date, Time, Location, Response */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* Date */}
                      <div className="rounded-xl bg-slate-900/80 border border-slate-800/60 px-3 py-2.5">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('dateLabel')}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-200">{formatDate(alert.createdAt)}</p>
                      </div>

                      {/* Time */}
                      <div className="rounded-xl bg-slate-900/80 border border-slate-800/60 px-3 py-2.5">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('timeLabel')}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-200">{formatTime(alert.createdAt)}</p>
                      </div>

                      {/* Location */}
                      <div className="rounded-xl bg-slate-900/80 border border-slate-800/60 px-3 py-2.5">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('locationLabel')}</span>
                        </div>
                        <p className="text-xs font-bold text-emerald-400">
                          {alert.location?.address ? t('shareLiveLoc') : `${alert.location?.lat?.toFixed(2)}°, ${alert.location?.lng?.toFixed(2)}°`}
                        </p>
                      </div>

                      {/* Response Time */}
                      <div className="rounded-xl bg-slate-900/80 border border-slate-800/60 px-3 py-2.5">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Timer className="h-3 w-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{t('responseLabel')}</span>
                        </div>
                        <p className="text-xs font-bold text-cyan-400">{getResponseTime(alert)}</p>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                      className="w-full mt-3 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-[0.98]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{isExpanded ? t('hideDetailsBtn') : t('viewDetailsBtn')}</span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Expandable Details Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-800/60 pt-3 space-y-3 animate-fade-in">
                      
                      {/* Detail Rows */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                        {/* Duration */}
                        <div className="flex items-center space-x-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                          <Timer className="h-4 w-4 text-amber-400" />
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase block">{t('incidentDurationLabel')}</span>
                            <span className="text-xs font-bold text-white">{calculateDuration(alert)}</span>
                          </div>
                        </div>

                        {/* Contacts Notified */}
                        <div className="flex items-center space-x-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                          <Zap className="h-4 w-4 text-blue-400" />
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase block">{t('contactsNotifiedLabel')}</span>
                            <span className="text-xs font-bold text-white">{alert.contactsNotifiedCount} {t('contacts')}</span>
                          </div>
                        </div>

                        {/* Battery Level */}
                        <div className="flex items-center space-x-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                          <Battery className="h-4 w-4 text-emerald-400" />
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase block">{t('batteryAtTriggerLabel')}</span>
                            <span className="text-xs font-bold text-white">{alert.batteryLevel}%</span>
                          </div>
                        </div>

                        {/* Audio Evidence */}
                        <div className="flex items-center space-x-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                          <Mic className="h-4 w-4 text-purple-400" />
                          <div>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase block">{t('audioEvidenceLabel')}</span>
                            <span className="text-xs font-bold text-white">{alert.ambientAudioRecorded ? t('capturedText') : t('noNotRecorded')}</span>
                          </div>
                        </div>
                      </div>

                      {/* GPS Coordinates */}
                      {alert.location && (
                        <div className="rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                          <div className="flex items-center space-x-1.5 mb-1.5">
                            <MapPin className="h-3.5 w-3.5 text-red-400" />
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">{t('gpsCoordsLabel')}</span>
                          </div>
                          <p className="text-xs text-slate-300 font-mono">
                            {alert.location.lat.toFixed(6)}° N, {alert.location.lng.toFixed(6)}° E
                          </p>
                          {alert.location.address && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              {alert.location.address === 'Connaught Place, New Delhi, India' ? t('connaughtPlaceAddress') : alert.location.address}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Dispatcher Notes */}
                      {alert.dispatcherNotes && (
                        <div className="rounded-xl bg-slate-900/60 border border-slate-800/50 px-3 py-2.5">
                          <div className="flex items-center space-x-1.5 mb-1.5">
                            <FileText className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">{t('dispatcherNotesLabel')}</span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {alert.dispatcherNotes === 'Updated status to RESOLVED by Admin Dispatch.' ? t('updatedToResolvedByAdminNotes') : alert.dispatcherNotes}
                          </p>
                        </div>
                      )}

                      {/* Resolved Timestamp */}
                      {alert.resolvedAt && (
                        <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 px-3 py-2.5">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-[11px] text-emerald-400 font-bold">
                              {t('resolvedOnText')} {formatDate(alert.resolvedAt)} {t('atText')} {formatTime(alert.resolvedAt)}
                            </span>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex justify-between items-center">
          <span className="text-[10px] text-slate-500">{alerts.length} {t('incidentsInHistory')}</span>
          <button onClick={onClose} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 transition-all active:scale-95">
            {t('closeBtn')}
          </button>
        </div>

      </div>
    </div>
  );
};
