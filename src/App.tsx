import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { useI18n } from './services/i18n';
import { SosButton } from './components/sos/SosButton';
import { StealthCalculator } from './components/sos/StealthCalculator';
import { SafetyPinModal } from './components/sos/SafetyPinModal';
import { LiveMap } from './components/tracking/LiveMap';
import { TelemetryHUD } from './components/tracking/TelemetryHUD';
import { GpsSimulator as GpsDemoMode } from './components/tracking/GpsSimulator';
import { EmergencyTimeline } from './components/tracking/EmergencyTimeline';
import { AlertLifecycle } from './components/sos/AlertLifecycle';
import { AlertHistoryModal } from './components/tracking/AlertHistoryModal';
import { SafetyReadiness } from './components/safety/SafetyReadiness';
import { PublicTracker } from './components/tracking/PublicTracker';
import { ContactsManager } from './components/contacts/ContactsManager';
import { NotificationLogModal } from './components/contacts/NotificationLogModal';
import { SafetyCheckIn } from './components/safety/SafetyCheckIn';
import { EmergencyHotlines } from './components/safety/EmergencyHotlines';
import { AudioRecorder } from './components/safety/AudioRecorder';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { MyDevicesModal } from './components/profile/MyDevicesModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { EmergencyAlert, EmergencyContact, GeoLocation, NotificationLog, User } from './types';
import { api } from './services/api';
import { socketService } from './services/socket';
import { GeolocationService, DEFAULT_LOCATION } from './services/geolocation';

export const App: React.FC = () => {
  // Navigation State
  const [activeView, setActiveView] = useState<'USER' | 'ADMIN' | 'PUBLIC'>('USER');
  const [trackingToken, setTrackingToken] = useState<string | null>(null);

  // User & Contacts
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'u-101',
    name: 'Srishti',
    email: 'srishtiankita38@gmail.com',
    phone: '+1 (555) 234-5678',
    role: 'USER',
    deactivationPin: '1234',
    stealthCode: '9999'
  });
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);

  // Geolocation & Telemetry State
  const [currentLocation, setCurrentLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [breadcrumbs, setBreadcrumbs] = useState<GeoLocation[]>([DEFAULT_LOCATION]);
  const [batteryLevel, setBatteryLevel] = useState<number>(84);
  const [gpsMode, setGpsMode] = useState<'REAL' | 'WALK' | 'DRIVE' | 'STATIONARY'>('WALK');

  // Emergency Alert State
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [activeAlertCount, setActiveAlertCount] = useState(1);

  // Modals & Disguise Toggles
  const [isStealthMode, setIsStealthMode] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check URL path for public tracking link (e.g. /track/token)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/track/')) {
      const token = path.replace('/track/', '');
      if (token) {
        setTrackingToken(token);
        setActiveView('PUBLIC');
      }
    }
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Fetch initial contacts, user profile, and logs
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setGlobalError(null);

      const token = localStorage.getItem('sos-session-token');
      if (!token) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      const [user, contactsData, logsData] = await Promise.all([
        api.getCurrentUser(),
        api.getContacts(),
        api.getLogs()
      ]);
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
      }
      setContacts(Array.isArray(contactsData) ? contactsData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (e: any) {
      console.error('Error loading initial data:', e);
      setGlobalError('Failed to synchronize safety telemetry with the security desk. Verify your network or restart the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  const { t, language } = useI18n();

  useEffect(() => {
    document.title = t('documentTitle');
  }, [language, t]);

  useEffect(() => {
    loadInitialData();

    // Connect WebSockets
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Continuous GPS Location updates & Socket streaming interval
  useEffect(() => {
    const updateLocationStep = async () => {
      let nextLoc: GeoLocation;

      if (gpsMode === 'REAL') {
        nextLoc = await GeolocationService.getCurrentLocation();
      } else {
        nextLoc = GeolocationService.generateSimulatedMovement(currentLocation, gpsMode);
      }

      setCurrentLocation(nextLoc);
      setBreadcrumbs(prev => [...prev.slice(-30), nextLoc]);

      // If emergency alert is active, stream location to backend & WebSockets
      if (activeAlert) {
        const bat = await GeolocationService.getBatteryLevel();
        setBatteryLevel(bat);
        socketService.streamLocation(activeAlert.id, nextLoc, bat);
        // Also call REST API sync
        api.updateLocation(activeAlert.id, nextLoc, bat);
      }
    };

    const interval = setInterval(updateLocationStep, activeAlert ? 2500 : 4000);
    return () => clearInterval(interval);
  }, [gpsMode, currentLocation, activeAlert]);

  // Trigger Silent SOS Action
  const handleTriggerSOS = async (triggerMethod: string) => {
    try {
      const alert = await api.triggerAlert({
        location: currentLocation,
        batteryLevel,
        ambientAudioRecorded: true,
        triggerMethod
      });
      setActiveAlert(alert);
      setActiveAlertCount(prev => prev + 1);
      socketService.joinAlertRoom(alert.id);
      setShowSuccessPopup(true);

      // Refresh logs
      const updatedLogs = await api.getLogs();
      setLogs(updatedLogs);
    } catch (e) {
      console.error('Error triggering SOS:', e);
    }
  };

  // Confirm PIN Deactivation
  const handleConfirmDeactivate = async (pin: string) => {
    if (!activeAlert) return;
    const updated = await api.updateAlertStatus(activeAlert.id, 'RESOLVED', pin, 'Deactivated by user with valid Safety PIN.');
    setActiveAlert(null);
    socketService.leaveAlertRoom(updated.id);
  };

  // Contacts CRUD actions
  const handleAddContact = async (contact: Partial<EmergencyContact>) => {
    const newContact = await api.addContact(contact);
    setContacts(prev => [...prev, newContact]);
  };

  const handleDeleteContact = async (id: string) => {
    await api.deleteContact(id);
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const handleEditContact = async (id: string, contactData: Partial<EmergencyContact>) => {
    const updatedContact = await api.editContact(id, contactData);
    setContacts(prev => prev.map(c => c.id === id ? updatedContact : c));
  };

  const handleTestContact = async (id: string) => {
    await api.testContactNotification(id);
    const updatedLogs = await api.getLogs();
    setLogs(updatedLogs);
  };

  const getLastAlertDetails = () => {
    if (activeAlert) {
      return `${new Date(activeAlert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${t('active')}`;
    }
    const safeLogs = Array.isArray(logs) ? logs : [];
    const lastEmergencyLog = safeLogs.find(l => l.alertId !== 'TEST');
    if (lastEmergencyLog) {
      return `${new Date(lastEmergencyLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${t('closedStatus')}`;
    }
    return t('noPastIncidentsText');
  };

  // Copy Shareable Tracking Link to Clipboard
  const handleCopyShareLink = () => {
    if (!activeAlert) return;
    const shareUrl = `${window.location.origin}/track/${activeAlert.trackingToken}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Live tracking link copied to clipboard!\n${shareUrl}`);
  };

  if (globalError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-slate-900/90 p-6 text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">Connection Error</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{globalError}</p>
          </div>
          <button
            onClick={loadInitialData}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-xs font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Synchronization</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col font-sans p-6 space-y-8 max-w-7xl mx-auto">
        {/* Skeleton Header */}
        <div className="h-20 w-full bg-slate-900 rounded-3xl animate-pulse border border-slate-800" />
        
        {/* Skeleton Alert status bar */}
        <div className="h-14 w-full bg-slate-900 rounded-2xl animate-pulse border border-slate-800" />

        {/* Skeleton Grid columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 space-y-8 flex flex-col justify-between h-[520px]">
            <div className="flex-1 bg-slate-900 rounded-3xl animate-pulse border border-slate-800" />
            <div className="flex-1 bg-slate-900 rounded-3xl animate-pulse border border-slate-800 mt-8" />
          </div>
          <div className="lg:col-span-7 bg-slate-900 rounded-3xl animate-pulse border border-slate-800 h-[520px]" />
        </div>
      </div>
    );
  }

  // Render Public Tracker View if path matches /track/:token
  if (activeView === 'PUBLIC' && trackingToken) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <PublicTracker token={trackingToken} onClose={() => setActiveView('USER')} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <AuthScreen
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          loadInitialData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      
      {/* Stealth Calculator Disguise Overlay */}
      {isStealthMode && (
        <StealthCalculator
          onTriggerSOS={(method) => handleTriggerSOS(method)}
          onExitStealth={() => setIsStealthMode(false)}
          stealthCode={currentUser.stealthCode}
        />
      )}

      {/* Navbar */}
      <Navbar
        user={currentUser}
        activeView={activeView}
        setActiveView={setActiveView}
        isStealthMode={isStealthMode}
        setIsStealthMode={setIsStealthMode}
        activeAlertCount={activeAlertCount}
        onOpenLogs={() => setIsLogsModalOpen(true)}
        onOpenContacts={() => {
          setActiveView('USER');
          const contactsEl = document.getElementById('contacts-section');
          contactsEl?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={() => {
          localStorage.removeItem('sos-session-token');
          setIsLoggedIn(false);
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeView === 'ADMIN' ? (
          <AdminDashboard />
        ) : (
          <div className="mx-auto max-w-7xl p-4 sm:p-6 space-y-8">
            
            <AlertLifecycle activeAlert={activeAlert} gpsConnected={true} />

            {/* Top Row: SOS Button Control & GPS Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* SOS Main Trigger Panel (5 cols) */}
              <div className="lg:col-span-5 space-y-8 flex flex-col justify-between h-full">
                <SosButton
                  onTriggerAlert={(method) => handleTriggerSOS(method)}
                  activeAlert={activeAlert}
                  onOpenDeactivate={() => setIsPinModalOpen(true)}
                />

                <SafetyReadiness
                  gpsConnected={true}
                  contactsCount={contacts.length}
                  checkInActive={false}
                  batteryLevel={batteryLevel}
                  gpsAccuracy={currentLocation.accuracy}
                  lastAlertInfo={getLastAlertDetails()}
                />
              </div>

              {/* Live Location Map & GPS Demo Mode Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-8 flex flex-col justify-between h-full">
                
                <GpsDemoMode mode={gpsMode} setMode={setGpsMode} location={currentLocation} />

                <LiveMap
                  location={currentLocation}
                  breadcrumbs={breadcrumbs}
                  userName={currentUser.name}
                  isEmergency={!!activeAlert}
                  height="370px"
                />

                <EmergencyTimeline activeAlert={activeAlert} />

              </div>

            </div>

            {/* Telemetry HUD */}
            <TelemetryHUD
              location={currentLocation}
              batteryLevel={batteryLevel}
              ambientAudio={!!activeAlert}
              contactsNotified={contacts.length}
              trackingToken={activeAlert?.trackingToken}
              onCopyShareLink={activeAlert ? handleCopyShareLink : undefined}
            />

            {/* Secondary Tools Grid: Contacts Manager + Safety Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Emergency Contacts Manager (7 cols) */}
              <div id="contacts-section" className="lg:col-span-7 h-full">
                <ContactsManager
                  contacts={contacts}
                  onAddContact={handleAddContact}
                  onDeleteContact={handleDeleteContact}
                  onEditContact={handleEditContact}
                  onTestContact={handleTestContact}
                />
              </div>

              {/* Safety Timers, Audio Recorder & Hotlines (5 cols) */}
              <div className="lg:col-span-5 space-y-8 h-full flex flex-col justify-between">
                
                <SafetyCheckIn onTriggerSOS={(reason) => handleTriggerSOS(reason)} />

                <AudioRecorder
                  isRecording={!!activeAlert}
                  activeAlert={activeAlert}
                  onUpdateNotes={async (notes) => {
                    if (activeAlert) {
                      const updated = await api.updateAlertStatus(activeAlert.id, activeAlert.status, undefined, notes);
                      setActiveAlert(updated);
                    }
                  }}
                />

                <EmergencyHotlines />

              </div>

            </div>

          </div>
        )}
      </main>

      {/* Safety PIN Deactivation Modal */}
      <SafetyPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirmDeactivate={handleConfirmDeactivate}
      />

      {/* Notification Logs Modal */}
      <NotificationLogModal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        logs={logs}
      />

      {/* Historical Alert Incidents Registry Modal */}
      <AlertHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Alert Trigger Success Popup Overlay */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-6 text-center space-y-5 shadow-2xl backdrop-blur-xl animate-fade-in">
            
            {/* Pulsing check circle indicator */}
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="text-2xl font-bold">✓</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">✅ Emergency Alert Sent Successfully</h2>
              <p className="text-xs text-slate-400">Your telemetry log has been successfully dispatched to the monitor desk.</p>
            </div>

            {/* Checklist details */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-900 text-xs text-left space-y-2.5">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Location Shared ({currentLocation.lat.toFixed(4)}°, {currentLocation.lng.toFixed(4)}°)</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300 border-t border-slate-900 pt-2.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{contacts.length} Contacts Notified</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300 border-t border-slate-900 pt-2.5">
                <span className="text-cyan-400 font-bold">🕒</span>
                <span>Estimated Response Time: 4 Minutes</span>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessPopup(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-xl shadow-lg transition-all active:scale-95"
            >
              Okay, Monitor Dispatch
            </button>
          </div>
        </div>
      )}

      {/* Emergency User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        contacts={contacts}
        onOpenDevices={() => {
          setIsProfileModalOpen(false);
          setIsDevicesModalOpen(true);
        }}
      />

      {/* My Devices Modal */}
      <MyDevicesModal
        isOpen={isDevicesModalOpen}
        onClose={() => setIsDevicesModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Silent SOS Emergency Response System • Version 1.0 Production Build
          </div>
          <div className="flex items-center space-x-3">
            <span>React.js</span>
            <span>•</span>
            <span>Node Express</span>
            <span>•</span>
            <span>Socket.IO</span>
            <span>•</span>
            <span>Leaflet Maps</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
