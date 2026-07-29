import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Radio, EyeOff, Users, LayoutDashboard, Bell, Clock, LogOut, AlertTriangle, CheckCircle2, Timer, Zap, ShieldCheck, X, MessageSquare, Settings, MapPin, Sun, Moon, Globe, Lock, Eye, Smartphone, Volume2, ChevronRight } from 'lucide-react';
import { User } from '../types';
import { useI18n } from '../services/i18n';

import { AppSettings, loadSavedSettings, saveSetting } from '../services/settings';

interface NavbarProps {
  user: User;
  activeView: 'USER' | 'ADMIN' | 'PUBLIC';
  setActiveView: (view: 'USER' | 'ADMIN' | 'PUBLIC') => void;
  isStealthMode: boolean;
  setIsStealthMode: (val: boolean) => void;
  activeAlertCount: number;
  onOpenLogs: () => void;
  onOpenContacts: () => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  settings?: AppSettings;
  onSettingsChange?: (newSettings: AppSettings) => void;
}

interface Notification {
  id: string;
  type: 'EMERGENCY' | 'CONTACT' | 'CHECKIN' | 'SOS_SUCCESS';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const generateNotifications = (): Notification[] => {
  const now = new Date();
  const fmt = (minAgo: number) => {
    const d = new Date(now.getTime() - minAgo * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return [
    {
      id: 'n-1',
      type: 'SOS_SUCCESS',
      title: 'sosAlertSentSuccessfully',
      message: 'sosAlertSentSuccessfullySub',
      time: fmt(2),
      read: false,
    },
    {
      id: 'n-2',
      type: 'EMERGENCY',
      title: 'emergencyUpdateTitle',
      message: 'emergencyUpdateSub',
      time: fmt(5),
      read: false,
    },
    {
      id: 'n-3',
      type: 'CONTACT',
      title: 'contactVerifiedTitle',
      message: 'contactVerifiedSub',
      time: fmt(30),
      read: true,
    },
    {
      id: 'n-4',
      type: 'CHECKIN',
      title: 'checkinReminderTitle',
      message: 'checkinReminderSubMsg',
      time: fmt(45),
      read: true,
    },
    {
      id: 'n-5',
      type: 'EMERGENCY',
      title: 'responderEnRouteTitle',
      message: 'responderEnRouteSub',
      time: fmt(60),
      read: true,
    },
    {
      id: 'n-6',
      type: 'CONTACT',
      title: 'contactAddedTitle',
      message: 'contactAddedSub',
      time: fmt(120),
      read: true,
    },
    {
      id: 'n-7',
      type: 'CHECKIN',
      title: 'checkinCompletedTitle',
      message: 'checkinCompletedSub',
      time: fmt(180),
      read: true,
    },
    {
      id: 'n-8',
      type: 'SOS_SUCCESS',
      title: 'alertResolvedTitle',
      message: 'alertResolvedSub',
      time: fmt(240),
      read: true,
    },
  ];
};

const getNotificationConfig = (type: Notification['type']) => {
  switch (type) {
    case 'EMERGENCY':
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-400',
        dotColor: 'bg-red-500',
        label: 'emergencyUpdateLabel',
      };
    case 'CONTACT':
      return {
        icon: <ShieldCheck className="h-4 w-4" />,
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
        dotColor: 'bg-blue-500',
        label: 'contactVerificationLabel',
      };
    case 'CHECKIN':
      return {
        icon: <Timer className="h-4 w-4" />,
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-400',
        dotColor: 'bg-amber-500',
        label: 'checkinReminderLabel',
      };
    case 'SOS_SUCCESS':
      return {
        icon: <CheckCircle2 className="h-4 w-4" />,
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
        dotColor: 'bg-emerald-500',
        label: 'sosSuccessLabel',
      };
  }
};

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  setActiveView,
  isStealthMode,
  setIsStealthMode,
  activeAlertCount,
  onOpenLogs,
  onOpenContacts,
  onOpenHistory,
  onOpenProfile,
  onLogout,
  settings: parentSettings,
  onSettingsChange
}) => {
  const { language, setLanguage, t } = useI18n();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(generateNotifications);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'EMERGENCY' | 'CONTACT' | 'CHECKIN' | 'SOS_SUCCESS'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Settings state (synced with parent or persistent local storage)
  const [internalSettings, setInternalSettings] = useState<AppSettings>(loadSavedSettings);
  const settings = parentSettings || internalSettings;

  const [pinChangeMode, setPinChangeMode] = useState<'NONE' | 'STEALTH' | 'SAFETY'>('NONE');
  const [pinInputValue, setPinInputValue] = useState('');

  // Handle theme change effect
  useEffect(() => {
    const applyTheme = (theme: 'dark' | 'light' | 'auto') => {
      const root = document.documentElement;
      let finalTheme: 'dark' | 'light' = 'dark';
      
      if (theme === 'auto') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        finalTheme = isSystemDark ? 'dark' : 'light';
      } else {
        finalTheme = theme;
      }
      
      if (finalTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme(settings.themeMode);
    localStorage.setItem('sos-theme-mode', settings.themeMode);

    // Watch for system color changes if themeMode is auto
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.themeMode === 'auto') {
        applyTheme('auto');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.themeMode]);

  const toggleSetting = (key: keyof AppSettings) => {
    const newValue = !settings[key];
    saveSetting(key, newValue);

    if (key === 'pushNotifications' && newValue) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }

    const updated = { ...settings, [key]: newValue };
    setInternalSettings(updated);
    if (onSettingsChange) {
      onSettingsChange(updated);
    }
  };

  const updateSettingValue = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    saveSetting(key, value);
    const updated = { ...settings, [key]: value };
    setInternalSettings(updated);
    if (onSettingsChange) {
      onSettingsChange(updated);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markOneRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (isStealthMode && activeView === 'USER') {
    return null; // Navbar is hidden in Stealth Disguise mode for max stealth
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand logo & status */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('USER')}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-700 shadow-lg shadow-red-500/20">
            <ShieldAlert className="h-6 w-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SILENT<span className="text-red-500">SOS</span>
              </span>
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
                v1.0 LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{t('logoSub')}</p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="hidden md:flex items-center space-x-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
          <button
            onClick={() => setActiveView('USER')}
            className={`flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeView === 'USER'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>{t('emergencyHub')}</span>
          </button>

          <button
            onClick={() => setActiveView('ADMIN')}
            className={`relative flex items-center space-x-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeView === 'ADMIN'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>{t('adminDashboard')}</span>
            {activeAlertCount > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {activeAlertCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Stealth Disguise Button */}
          {activeView === 'USER' && (
            <button
               onClick={() => setIsStealthMode(true)}
               title={t('stealthModeDisguise')}
               className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">{t('stealthCode')}</span>
            </button>
          )}

          {/* Emergency Contacts Button */}
          <button
            onClick={onOpenContacts}
            title={t('trustedContacts')}
            className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t('contacts')}</span>
          </button>

          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              title={t('notifications')}
              className={`relative flex items-center justify-center rounded-lg border p-2 transition-colors ${
                isNotifOpen
                  ? 'border-red-500/30 bg-slate-800 text-white'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg shadow-red-500/30 min-w-[18px] h-[18px]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[380px] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden z-50">
                
                {/* Dropdown Header */}
                <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4 text-red-400" />
                    <h3 className="text-sm font-bold text-white">{t('notifications')}</h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                        {unreadCount} {t('newLabel')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {t('markAllRead')}
                      </button>
                    )}
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="rounded-lg p-1 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Category Filter Chips */}
                <div className="px-4 py-2.5 border-b border-slate-800/40 flex items-center space-x-2 overflow-x-auto">
                  {[
                    { type: 'ALL' as const, emoji: '🔔', label: t('all') },
                    { type: 'EMERGENCY' as const, emoji: '🚨', label: t('emergency') },
                    { type: 'CONTACT' as const, emoji: '👤', label: t('contacts') },
                    { type: 'CHECKIN' as const, emoji: '⏰', label: t('checkin') },
                    { type: 'SOS_SUCCESS' as const, emoji: '✅', label: t('sos') },
                  ].map(cat => {
                    const count = cat.type === 'ALL' 
                      ? notifications.length 
                      : notifications.filter(n => n.type === cat.type).length;
                    const isActive = notifFilter === cat.type;
                    return (
                      <button
                        key={cat.type}
                        onClick={() => setNotifFilter(cat.type)}
                        className={`flex-shrink-0 flex items-center space-x-1 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all ${
                          isActive
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                        <span className={isActive ? 'text-red-300' : 'text-slate-650'}>({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Notification Items List */}
                <div className="max-h-[360px] overflow-y-auto">
                  {notifications
                    .filter(n => notifFilter === 'ALL' || n.type === notifFilter)
                    .map((notif) => {
                      const config = getNotificationConfig(notif.type);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markOneRead(notif.id);
                            setIsNotifOpen(false);
                            // Routing/Modals redirection logic based on category type
                            if (notif.type === 'EMERGENCY') {
                              onOpenHistory(); // Open dispatch logs or incident history
                            } else if (notif.type === 'CONTACT') {
                              onOpenContacts(); // Opens Contacts configuration tab
                            } else if (notif.type === 'CHECKIN') {
                              onOpenProfile(); // Check-in details are listed under medical profile info
                            } else if (notif.type === 'SOS_SUCCESS') {
                              setActiveView('USER'); // Emergency hub view
                            }
                          }}
                          className={`px-4 py-3 border-b border-slate-800/30 cursor-pointer transition-all hover:bg-slate-800/30 ${
                            !notif.read ? 'bg-slate-800/10' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl ${config.bg} ${config.text} border ${config.border} mt-0.5`}>
                              {config.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <h4 className={`text-xs font-bold truncate ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                                      {t(notif.title as any)}
                                    </h4>
                                    {!notif.read && (
                                      <span className={`flex-shrink-0 h-2 w-2 rounded-full ${config.dotColor}`} />
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                    {t(notif.message as any)}
                                  </p>
                                </div>
                              </div>

                              {/* Footer: Time + Category */}
                              <div className="flex items-center space-x-2 mt-1.5">
                                <span className="text-[9px] font-mono font-bold text-slate-600">{notif.time}</span>
                                <span className={`text-[9px] font-bold ${config.text} ${config.bg} border ${config.border} px-1.5 py-0.5 rounded`}>
                                  {t(config.label as any)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Dropdown Footer */}
                <div className="px-4 py-3 border-t border-slate-800/60 flex items-center justify-between">
                  <button
                    onClick={() => { setIsNotifOpen(false); onOpenLogs(); }}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {t('viewAllLogs')}
                  </button>
                  <span className="text-[10px] text-slate-600">
                    {notifications.filter(n => notifFilter === 'ALL' || n.type === notifFilter).length} {t('itemsListed')}
                  </span>
                </div>

              </div>
            )}
          </div>

          {/* Historical Incident Archive Registry Button */}
          <button
            onClick={onOpenHistory}
            title={t('viewHistoricalLogs')}
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <Clock className="h-4 w-4" />
          </button>

          {/* Settings Gear with Dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsNotifOpen(false); }}
              title={t('settings')}
              className={`flex items-center justify-center rounded-lg border p-2 transition-colors ${
                isSettingsOpen
                  ? 'border-slate-600 bg-slate-800 text-white'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Settings className={`h-4 w-4 transition-transform duration-300 ${isSettingsOpen ? 'rotate-90' : ''}`} />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-2 w-[340px] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden z-50">

                {/* Settings Header */}
                <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-slate-400" />
                    <h3 className="text-sm font-bold text-white">{t('settings')}</h3>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="rounded-lg p-1 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">

                  {/* Notification Settings */}
                  <div className="px-4 py-3 border-b border-slate-800/30">
                    <div className="flex items-center space-x-1.5 mb-3">
                      <Bell className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('notifications')}</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { key: 'pushNotifications' as const, label: t('notifications'), icon: <Smartphone className="h-3.5 w-3.5 text-blue-400" /> },
                        { key: 'sosAlerts' as const, label: t('sosTriggered'), icon: <Volume2 className="h-3.5 w-3.5 text-red-400" /> },
                        { key: 'checkInReminders' as const, label: t('checkinTimerLabel'), icon: <Timer className="h-3.5 w-3.5 text-amber-400" /> },
                        { key: 'soundAlerts' as const, label: t('anonymousMode'), icon: <EyeOff className="h-3.5 w-3.5 text-purple-400" /> },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-2.5">
                            {item.icon}
                            <span className="text-xs text-slate-300">{item.label}</span>
                          </div>
                          <button
                            onClick={() => toggleSetting(item.key)}
                            className={`relative w-9 h-5 rounded-full transition-all duration-200 ${settings[item.key] ? 'bg-emerald-500' : 'bg-slate-700'}`}
                          >
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${settings[item.key] ? 'left-[18px]' : 'left-0.5'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GPS Permission */}
                  <div className="px-4 py-3 border-b border-slate-800/30">
                    <div className="flex items-center space-x-1.5 mb-3">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('gpsStatusLabel')}</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { key: 'gpsPermission' as const, label: t('gpsConnectedLabel'), icon: <MapPin className="h-3.5 w-3.5 text-emerald-400" /> },
                        { key: 'highAccuracyGps' as const, label: t('gpsAccuracyLabel'), icon: <Zap className="h-3.5 w-3.5 text-cyan-400" /> },
                        { key: 'backgroundTracking' as const, label: t('activeLocation'), icon: <Eye className="h-3.5 w-3.5 text-amber-400" /> },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-2.5">
                            {item.icon}
                            <span className="text-xs text-slate-300">{item.label}</span>
                          </div>
                          <button
                            onClick={() => toggleSetting(item.key)}
                            className={`relative w-9 h-5 rounded-full transition-all duration-200 ${settings[item.key] ? 'bg-emerald-500' : 'bg-slate-700'}`}
                          >
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${settings[item.key] ? 'left-[18px]' : 'left-0.5'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="px-4 py-3 border-b border-slate-800/30">
                    <div className="flex items-center space-x-1.5 mb-3">
                      <Sun className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('themeMode')}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-850 text-xs font-bold">
                      {(['dark', 'light', 'auto'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => updateSettingValue('themeMode', mode)}
                          className={`flex-1 py-1.5 rounded-lg transition-all capitalize ${
                            settings.themeMode === mode
                              ? 'bg-slate-800 text-white border border-slate-700'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {mode === 'dark' ? t('darkTheme') : mode === 'light' ? t('lightTheme') : t('autoTheme')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="px-4 py-3 border-b border-slate-800/30">
                    <div className="flex items-center space-x-1.5 mb-3">
                      <Globe className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('language')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {(['English', 'Hindi'] as const).map(lang => (
                        <button
                          key={lang}
                          onClick={() => {
                            setLanguage(lang);
                            updateSettingValue('language', lang);
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            language === lang
                              ? 'bg-cyan-500/15 border border-cyan-500/25 text-cyan-400'
                              : 'bg-slate-800/40 border border-slate-700/40 text-slate-500 hover:text-slate-355'
                          }`}
                        >
                          {lang === 'Hindi' ? 'हिन्दी (Hindi)' : 'English'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Biometrics Authorization Security Lock */}
                  <div className="px-4 py-3 border-b border-slate-800/30">
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2.5">
                        <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs text-slate-300 font-medium">{t('biometrics')}</span>
                      </div>
                      <button
                        onClick={() => toggleSetting('biometricsEnabled')}
                        className={`relative w-9 h-5 rounded-full transition-all duration-200 ${settings.biometricsEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${settings.biometricsEnabled ? 'left-[18px]' : 'left-0.5'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Privacy */}
                  <div className="px-4 py-3 border-b border-slate-800/30">
                    <div className="flex items-center space-x-1.5 mb-3">
                      <Lock className="h-3.5 w-3.5 text-rose-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('privacy')}</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { key: 'shareLocation' as const, label: t('shareLiveLoc'), icon: <MapPin className="h-3.5 w-3.5 text-emerald-400" /> },
                        { key: 'anonymousMode' as const, label: t('anonymousMode'), icon: <EyeOff className="h-3.5 w-3.5 text-purple-400" /> },
                        { key: 'dataEncryption' as const, label: t('endToEndEnc'), icon: <Lock className="h-3.5 w-3.5 text-rose-400" /> },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-2.5">
                            {item.icon}
                            <span className="text-xs text-slate-300">{item.label}</span>
                          </div>
                          <button
                            onClick={() => toggleSetting(item.key)}
                            className={`relative w-9 h-5 rounded-full transition-all duration-200 ${settings[item.key] ? 'bg-emerald-500' : 'bg-slate-700'}`}
                          >
                            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${settings[item.key] ? 'left-[18px]' : 'left-0.5'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account Security PIN Modification */}
                  <div className="px-4 py-3">
                    <div className="flex items-center space-x-1.5 mb-3">
                      <Lock className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('securityCodes')}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-800/30">
                        <div>
                          <span className="text-xs text-slate-300 block font-bold">{t('stealthCode')}</span>
                          <span className="text-[10px] text-slate-500">{t('stealthCodeDesc')}</span>
                        </div>
                        <button
                          onClick={() => {
                            const newCode = prompt(t('enterStealthPrompt'), user.stealthCode || "9999");
                            if (newCode && newCode.length === 4) {
                              user.stealthCode = newCode;
                              alert(t('stealthUpdatedSuccess') + newCode);
                            }
                          }}
                          className="text-xs font-mono font-bold text-red-400 hover:bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
                        >
                          {user.stealthCode || '9999'} ✏️
                        </button>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <div>
                          <span className="text-xs text-slate-300 block font-bold">{t('safetyPIN')}</span>
                          <span className="text-[10px] text-slate-500">{t('safetyPINDesc')}</span>
                        </div>
                        <button
                          onClick={() => {
                            const newPin = prompt(t('enterSafetyPinPrompt'), user.deactivationPin || "1234");
                            if (newPin && newPin.length === 4) {
                              user.deactivationPin = newPin;
                              alert(t('safetyPinUpdatedSuccess') + newPin);
                            }
                          }}
                          className="text-xs font-mono font-bold text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                        >
                          {user.deactivationPin || '1234'} ✏️
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-slate-800/60 text-center">
                  <span className="text-[10px] text-slate-600">{t('savedLocally')}</span>
                </div>
              </div>
            )}
          </div>

          {/* User profile */}
          <button
            onClick={onOpenProfile}
            title={t('profileHeader')}
            className="hidden sm:flex items-center space-x-2.5 pl-3 border-l border-slate-800 hover:opacity-90 active:scale-95 transition-all text-left focus:outline-none group"
          >
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-600/10 border border-red-500/20 flex items-center justify-center font-bold text-xs text-red-400 group-hover:border-red-500/40 transition-colors">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
            <div className="text-left leading-tight hidden lg:block">
              <div className="text-xs font-bold text-slate-200 group-hover:text-white">{user.name}</div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="rounded bg-red-500/10 border border-red-500/20 px-1.5 py-0 text-[9px] font-bold text-red-400">{t('oNegativeGroup')}</span>
                <span className="text-[10px] text-slate-500">{user.role === 'ADMIN' ? t('adminRole') : t('activeUser')}</span>
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title={t('logout')}
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>

        </div>

      </div>

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-center space-y-5 animate-fade-in">
            
            {/* Icon */}
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
              <LogOut className="h-6 w-6 text-red-400" />
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white">{t('logoutConfirm')}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('logoutConfirmSub')}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-3 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-300 border border-slate-700 transition-all active:scale-95"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('logout')}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
