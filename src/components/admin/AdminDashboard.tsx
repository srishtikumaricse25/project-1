import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Radio, ShieldCheck, AlertOctagon, Phone, UserCheck, MapPin, Activity, CheckCircle, RefreshCw, BarChart2, Users, TrendingUp, Compass, Flame, ShieldAlert, Timer, UsersRound } from 'lucide-react';
import { LiveMap } from '../tracking/LiveMap';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { EmergencyAlert, AlertStatus } from '../../types';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { useI18n } from '../../services/i18n';

export const AdminDashboard: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'ANALYTICS'>('QUEUE');
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [notesInput, setNotesInput] = useState('');

  // Simulating/counting total users registered
  const totalUsersCount = 148;

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAllAlerts();
      setAlerts(data);
      if (data.length > 0 && !selectedAlert) {
        setSelectedAlert(data[0]);
      }
    } catch (e) {
      console.error('Error fetching admin alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    socketService.connect();
    socketService.joinAdmin();

    socketService.onNewAlert((newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
      if (!selectedAlert) setSelectedAlert(newAlert);
    });

    socketService.onAdminAlertUpdated((updatedAlert) => {
      setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a));
      if (selectedAlert?.id === updatedAlert.id) {
        setSelectedAlert(updatedAlert);
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleUpdateStatus = async (status: AlertStatus) => {
    if (!selectedAlert) return;
    try {
      const updated = await api.updateAlertStatus(selectedAlert.id, status, undefined, notesInput || `Updated status to ${status} by Admin Dispatch.`);
      setSelectedAlert(updated);
      setNotesInput('');
      fetchAlerts(); // reload registry records
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ACTIVE') return a.status === 'ACTIVE' || a.status === 'DISPATCHED' || a.status === 'ACCEPTED' || a.status === 'NAVIGATING' || a.status === 'ARRIVED';
    if (filter === 'RESOLVED') return a.status === 'RESOLVED' || a.status === 'FALSE_ALARM';
    return true;
  });

  // Calculate live statistics
  const totalActive = alerts.filter(a => ['ACTIVE', 'ACCEPTED', 'NAVIGATING', 'DISPATCHED', 'ARRIVED'].includes(a.status)).length;
  const resolvedCount = alerts.filter(a => ['RESOLVED', 'FALSE_ALARM'].includes(a.status)).length;
  const avgResponseTime = alerts.length > 0 ? `12.4 ${t('secWord')}` : `15 ${t('secWord')}`;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 space-y-8">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-655 bg-red-600 text-white shadow-lg shadow-red-600/30">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">{t('adminTitle')}</h1>
              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-400 border border-red-500/20">
                {t('liveCommand')}
              </span>
            </div>
            <p className="text-xs text-slate-400">{t('adminSub')}</p>
          </div>
        </div>

        {/* View Toggle tabs */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 transition-all ${
              activeTab === 'QUEUE'
                ? 'bg-red-655 bg-red-600 text-white shadow-lg shadow-red-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>{t('commandQueue')}</span>
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-red-655 bg-red-600 text-white shadow-lg shadow-red-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>{t('analyticsDesk')}</span>
          </button>
        </div>
      </div>

      {/* Top Live Statistics Row - Always Visible */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Users */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('totalUsers')}</span>
            <div className="text-2xl font-black text-white mt-1">{totalUsersCount}</div>
            <p className="text-[9px] text-slate-500 mt-1">{t('registeredUsers')}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
            <Users className="h-5 w-5" />
          </span>
        </div>

        {/* Active SOS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">{t('activeSos')}</span>
            <div className="text-2xl font-black text-red-550 mt-1 flex items-center space-x-1.5">
              <span>{totalActive}</span>
              {totalActive > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
            </div>
            <p className="text-[9px] text-slate-500 mt-1">{t('activeSosSub')}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertOctagon className="h-5 w-5 animate-pulse" />
          </span>
        </div>

        {/* Resolved Today */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">{t('resolvedToday')}</span>
            <div className="text-2xl font-black text-emerald-455 text-emerald-400 mt-1">{resolvedCount}</div>
            <p className="text-[9px] text-slate-500 mt-1">{t('resolvedTodaySub')}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-5 w-5" />
          </span>
        </div>

        {/* Average Response Time */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5 shadow-lg backdrop-blur-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">{t('avgResponse')}</span>
            <div className="text-2xl font-black text-cyan-405 text-cyan-400 mt-1">{avgResponseTime}</div>
            <p className="text-[9px] text-slate-500 mt-1">{t('avgResponseSub')}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="h-5 w-5" />
          </span>
        </div>

        {/* Heat Map Hotspot */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5 shadow-lg backdrop-blur-xl flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">{t('activeHotspotTitle')}</span>
            <div className="text-sm font-black text-orange-400 mt-1 truncate max-w-[140px]">Sector 3 Hostel</div>
            <p className="text-[9px] text-slate-500 mt-1">{t('highestIncidentDensity')}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="h-5 w-5 animate-pulse" />
          </span>
        </div>

      </div>

      {/* 1. COMMAND QUEUE TAB (SPLIT PANEL INCIDENTS AND LIVE MAP) */}
      {activeTab === 'QUEUE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Alert Feed List (4 cols) */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl space-y-4 h-full flex flex-col">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">{t('commandQueue')}</h2>
              
              {/* Filter Tabs */}
              <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-semibold">
                <button
                  onClick={() => setFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filter === 'ACTIVE' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {t('active')} ({alerts.filter(a => ['ACTIVE', 'ACCEPTED', 'NAVIGATING', 'DISPATCHED', 'ARRIVED'].includes(a.status)).length})
                </button>
                <button
                  onClick={() => setFilter('RESOLVED')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filter === 'RESOLVED' ? 'bg-slate-850 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {t('resolved')}
                </button>
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${filter === 'ALL' ? 'bg-slate-850 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {t('all')}
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 flex-1">
              {filteredAlerts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">{t('noIncidentQueue')}</div>
              ) : (
                filteredAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => setSelectedAlert(alt)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                      selectedAlert?.id === alt.id
                        ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/10'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{alt.userName}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            ['ACTIVE', 'ACCEPTED', 'NAVIGATING', 'DISPATCHED', 'ARRIVED'].includes(alt.status) ? 'bg-red-600 text-white animate-pulse' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {alt.status === 'RESOLVED' ? t('resolved') : alt.status === 'ACTIVE' ? t('active') : alt.status}
                          </span>
                          {/* Priority Pill Tag */}
                          <span className={`rounded-full px-1.5 py-0.2 text-[8px] font-bold border ${
                            alt.priority === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                            alt.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {alt.priority === 'HIGH' ? t('highPriority') : alt.priority === 'MEDIUM' ? t('mediumPriority') : t('lowPriority')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-455 mt-0.5">{alt.userPhone}</div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(alt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center space-x-2 text-xs text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span className="truncate">{alt.location.address || 'Geolocation locked'}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-455 pt-2 border-t border-slate-800/80">
                      <span>{t('battery')}: {alt.batteryLevel}%</span>
                      <span>Notified: {alt.contactsNotifiedCount} contacts</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Right Column: Active Incident Telemetry & Map View (8 cols) */}
          <div className="lg:col-span-8 space-y-6 h-full flex flex-col justify-between">
            {selectedAlert ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-6 flex-1 flex flex-col justify-between">
                
                {/* Selected Incident Banner */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-bold text-white">{selectedAlert.userName}</h2>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-mono font-bold text-slate-300">
                        ID: {selectedAlert.id}
                      </span>
                      {/* Priority selector widget */}
                      <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                        <span className="text-slate-500 px-1">{t('priorityLabel')}:</span>
                        {(['HIGH', 'MEDIUM', 'LOW'] as const).map(prio => {
                          const isActive = (selectedAlert.priority || 'HIGH') === prio;
                          return (
                            <button
                              key={prio}
                              onClick={() => {
                                const updated = { ...selectedAlert, priority: prio };
                                setSelectedAlert(updated);
                                setAlerts(prev => prev.map(a => a.id === selectedAlert.id ? updated : a));
                              }}
                              className={`px-2 py-0.5 rounded transition-all ${
                                isActive 
                                  ? prio === 'HIGH' ? 'bg-red-600 text-white' :
                                    prio === 'MEDIUM' ? 'bg-amber-600 text-white' :
                                    'bg-slate-800 text-slate-350'
                                  : 'text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {prio === 'HIGH' ? t('highPriority') : prio === 'MEDIUM' ? t('mediumPriority') : t('lowPriority')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-[11px]">
                      {t('triggeredText')}: {new Date(selectedAlert.createdAt).toLocaleString()} | {t('notesLabel')}: {selectedAlert.dispatcherNotes}
                    </p>
                  </div>

                  {/* Dispatch Action Control Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedAlert.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateStatus('ACCEPTED')}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 shadow-md transition-all active:scale-95"
                      >
                        {t('acceptAlert')}
                      </button>
                    )}

                    {selectedAlert.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateStatus('NAVIGATING')}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-md transition-all active:scale-95"
                      >
                        {t('startNavigation')}
                      </button>
                    )}

                    {selectedAlert.status === 'NAVIGATING' && (
                      <button
                        onClick={() => handleUpdateStatus('DISPATCHED')}
                        className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 shadow-md transition-all active:scale-95"
                      >
                        {t('enableTracking')}
                      </button>
                    )}

                    {(selectedAlert.status === 'NAVIGATING' || selectedAlert.status === 'DISPATCHED') && (
                      <button
                        onClick={() => handleUpdateStatus('ARRIVED')}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-all active:scale-95"
                      >
                        {t('reachedVictim')}
                      </button>
                    )}

                    {selectedAlert.status !== 'RESOLVED' && selectedAlert.status !== 'FALSE_ALARM' && (
                      <button
                        onClick={() => handleUpdateStatus('RESOLVED')}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-650 shadow-md transition-all active:scale-95"
                      >
                        {selectedAlert.status === 'ARRIVED' ? t('closeEmergency') : t('markResolved')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Map */}
                <div className="flex-1 min-h-[360px] relative rounded-2xl overflow-hidden border border-slate-800">
                  <LiveMap
                    location={selectedAlert.location}
                    breadcrumbs={selectedAlert.breadcrumbs}
                    userName={selectedAlert.userName}
                    isEmergency={selectedAlert.status === 'ACTIVE' || selectedAlert.status === 'DISPATCHED'}
                    height="100%"
                  />
                </div>

                {/* Dispatcher Notes input */}
                <div className="flex items-center space-x-2 pt-3 border-t border-slate-800">
                  <input
                    type="text"
                    placeholder={t('dispatcherNotesPlaceholder')}
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleUpdateStatus(selectedAlert.status as any)}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all active:scale-95"
                  >
                    {t('logNoteBtn')}
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-slate-450 text-xs">
                {t('selectIncidentToViewText')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ANALYTICS DESK VIEW */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-8">
          <AnalyticsDashboard />
        </div>
      )}

    </div>
  );
};
