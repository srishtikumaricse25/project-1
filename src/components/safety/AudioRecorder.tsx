import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX, Lock, CloudLightning, Video, Camera, FileText, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { EmergencyAlert } from '../../types';
import { useI18n } from '../../services/i18n';

interface AudioRecorderProps {
  isRecording: boolean;
  activeAlert: EmergencyAlert | null;
  onUpdateNotes?: (notes: string) => Promise<void>;
  dataEncryptionEnabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isRecording,
  activeAlert,
  onUpdateNotes,
  dataEncryptionEnabled = true
}) => {
  const { t } = useI18n();
  const [spectrum, setSpectrum] = useState<number[]>([20, 30, 20, 15, 20, 25, 20, 15, 20, 15]);
  const [sirenActive, setSirenActive] = useState(false);

  // Privacy & Consent States
  const [audioConsentGranted, setAudioConsentGranted] = useState(true); // Default to true for ease of QA
  const [mediaConsentGranted, setMediaConsentGranted] = useState(true);

  // Evidence Inputs State
  const [incidentNotes, setIncidentNotes] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [notesSyncing, setNotesSyncing] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  
  // New Enhanced Status States
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [encryptedSizeKB, setEncryptedSizeKB] = useState(0);
  const durationIntervalRef = useRef<any>(null);
  const uploadIntervalRef = useRef<any>(null);

  useEffect(() => {
    let interval: any = null;
    if (isRecording && audioConsentGranted) {
      // Pulse spectrum
      interval = setInterval(() => {
        setSpectrum(prev => prev.map(() => Math.floor(15 + Math.random() * 80)));
      }, 120);

      // Increment recording duration and simulated encrypted size
      durationIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
        setEncryptedSizeKB(prev => prev + Math.floor(12 + Math.random() * 8));
      }, 1000);

      // Simulate continuous upload sync progress looping from 75% to 100%
      uploadIntervalRef.current = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 98) return 75;
          return prev + Math.floor(2 + Math.random() * 4);
        });
      }, 800);

    } else {
      setSpectrum([20, 30, 20, 15, 20, 25, 20, 15, 20, 15]);
      setRecordingSeconds(0);
      setUploadProgress(0);
      setEncryptedSizeKB(0);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
    };
  }, [isRecording, audioConsentGranted]);

  const toggleSirenSound = () => {
    setSirenActive(!sirenActive);
  };

  const handleSyncNotes = async () => {
    if (!activeAlert || !onUpdateNotes || !incidentNotes) return;
    try {
      setNotesSyncing(true);
      await onUpdateNotes(incidentNotes);
      alert(t('incidentSyncSuccess'));
    } catch (e) {
      console.error(e);
    } finally {
      setNotesSyncing(false);
    }
  };

  const handleSimulatePhoto = () => {
    if (!mediaConsentGranted) {
      alert(t('mediaPermissionError'));
      return;
    }
    setPhotoUploading(true);
    setPhotoUploadProgress(10);
    
    // Simulate photo upload progress bar increments
    const interval = setInterval(() => {
      setPhotoUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setCapturedPhoto('discreet_snapshot_evidence_0892.jpg');
          setPhotoUploading(false);
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isRecording ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' : 'bg-slate-950 text-slate-500'
          }`}>
            <Video className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('evidenceCenterTitle')}</h3>
            <span className="text-[10px] text-slate-500 font-mono">
              {isRecording ? t('activeIncidentRecorder') : t('stealthStandbyText')}
            </span>
          </div>
        </div>

        <button
          onClick={toggleSirenSound}
          title={sirenActive ? t('muteSirenBtn') : t('activateSirenBtn')}
          className={`flex items-center space-x-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
            sirenActive
              ? 'bg-red-600 text-white animate-bounce shadow-lg'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          {sirenActive ? <Volume2 className="h-3.5 w-3.5 animate-pulse" /> : <VolumeX className="h-3.5 w-3.5" />}
          <span>{sirenActive ? t('sirenOnText') : t('sirenOffText')}</span>
        </button>
      </div>

      {/* Permissions & Indicators Sub-Grid */}
      <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950 rounded-2xl border border-slate-900 text-[10px]">
        <div className="flex items-center justify-between px-2 py-1 bg-slate-900 rounded-lg border border-slate-850">
          <span className="text-slate-400 font-semibold uppercase">{t('microphoneLabel')}</span>
          <span className="flex items-center space-x-1">
            <span className={`h-1.5 w-1.5 rounded-full ${audioConsentGranted ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={audioConsentGranted ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {audioConsentGranted ? t('grantedText') : t('pendingConsentText')}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between px-2 py-1 bg-slate-900 rounded-lg border border-slate-850">
          <span className="text-slate-400 font-semibold uppercase">{t('cameraLabel')}</span>
          <span className="flex items-center space-x-1">
            <span className={`h-1.5 w-1.5 rounded-full ${mediaConsentGranted ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={mediaConsentGranted ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {mediaConsentGranted ? t('grantedText') : t('pendingConsentText')}
            </span>
          </span>
        </div>
      </div>

      {/* Consent Configuration Drawers */}
      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-900 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex flex-col pr-3">
            <span className="font-bold text-slate-300">{t('ambientAudioConsentTitle')}</span>
            <span className="text-[9px] text-slate-500 leading-normal">
              {t('ambientAudioConsentDesc')}
            </span>
          </div>
          <input
            type="checkbox"
            checked={audioConsentGranted}
            onChange={(e) => setAudioConsentGranted(e.target.checked)}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-800 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-900 pt-2">
          <div className="flex flex-col pr-3">
            <span className="font-bold text-slate-300">{t('discreetCameraConsentTitle')}</span>
            <span className="text-[9px] text-slate-500 leading-normal">
              {t('discreetCameraConsentDesc')}
            </span>
          </div>
          <input
            type="checkbox"
            checked={mediaConsentGranted}
            onChange={(e) => setMediaConsentGranted(e.target.checked)}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-800 cursor-pointer"
          />
        </div>
      </div>

      {/* Status Cards Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        
        {/* Audio Capture */}
        <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/60 flex items-center space-x-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
            isRecording && audioConsentGranted ? 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse' : 'text-slate-500 bg-slate-900 border-slate-850'
          }`}>
            <Mic className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[9px] text-slate-500 font-bold uppercase">{t('recordingStatusLabel')}</div>
            <div className="text-[10px] font-semibold text-slate-200 mt-0.5">
              {isRecording && audioConsentGranted ? `Recording: ${formatDuration(recordingSeconds)}` : t('standbyLockedText')}
            </div>
          </div>
        </div>

        {/* Cryptography / Storage Status */}
        <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/60 flex items-center space-x-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
            dataEncryptionEnabled
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          }`}>
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[9px] text-slate-500 font-bold uppercase">{t('encryptedStorageLabel')}</div>
            <div className={`text-[10px] font-semibold mt-0.5 ${dataEncryptionEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
              {dataEncryptionEnabled
                ? (isRecording ? `AES-256 (${encryptedSizeKB} KB)` : 'AES-256 GCM')
                : 'Unencrypted Payload'}
            </div>
          </div>
        </div>

        {/* Cloud Sync */}
        <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/60 flex items-center space-x-2.5">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
            isRecording ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-slate-500 bg-slate-900 border-slate-850'
          }`}>
            <CloudLightning className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[9px] text-slate-500 font-bold uppercase">{t('cloudSyncLabel')}</div>
            <div className="text-[10px] font-semibold text-slate-200 mt-0.5">
              {isRecording ? `${t('uploadingText')} ${uploadProgress}%` : t('syncedText')}
            </div>
          </div>
        </div>

      </div>

      {/* Audio Wave Visualizer */}
      <div className="flex h-10 items-center justify-center space-x-1.5 rounded-2xl bg-slate-950 p-3.5 border border-slate-800/80">
        {spectrum.map((val, idx) => (
          <div
            key={idx}
            style={{ height: `${val}%` }}
            className={`w-2 rounded-full transition-all duration-150 ${
              isRecording && audioConsentGranted ? 'bg-gradient-to-t from-red-600 to-rose-400' : 'bg-slate-855'
            }`}
          />
        ))}
      </div>

      {/* Uploading Progress Bars */}
      {isRecording && (
        <div className="space-y-2 text-[10px] bg-slate-950 p-2.5 rounded-2xl border border-slate-900">
          
          {/* Audio stream upload bar */}
          {audioConsentGranted && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>{t('syncingAudioStream')}</span>
                <span className="font-bold font-mono text-cyan-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-850">
                <div 
                  style={{ width: `${uploadProgress}%` }}
                  className="bg-cyan-500 h-1 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Photo upload progress bar */}
          {photoUploading && (
            <div className="space-y-1 pt-1.5 border-t border-slate-900">
              <div className="flex items-center justify-between text-slate-400">
                <span>{t('uploadingSnapshotEvidence')}</span>
                <span className="font-bold font-mono text-amber-400">{photoUploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-850">
                <div 
                  style={{ width: `${photoUploadProgress}%` }}
                  className="bg-amber-500 h-1 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* 4. Active Incident Notes & Photo Evidence capture */}
      {isRecording && activeAlert && (
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-900 space-y-3">
          
          {/* Notes logger */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase">
              <FileText className="h-3.5 w-3.5" />
              <span>{t('incidentNotesTitle')}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('incidentNotesPlaceholder')}
                value={incidentNotes}
                onChange={(e) => setIncidentNotes(e.target.value)}
                className="flex-1 rounded-xl border border-slate-850 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-650 focus:border-red-500 focus:outline-none"
              />
              <button
                onClick={handleSyncNotes}
                disabled={notesSyncing}
                className="px-3 bg-red-600 hover:bg-red-500 text-xs font-bold text-white rounded-xl shadow transition-all active:scale-95 disabled:opacity-50"
              >
                {notesSyncing ? t('sendingText') : t('syncNotesBtn')}
              </button>
            </div>
          </div>

          {/* Photo evidence upload */}
          <div className="pt-2.5 border-t border-slate-900 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <Camera className="h-3.5 w-3.5" />
                <span>{t('discreetCameraEvidenceTitle')}</span>
              </div>
              
              <button
                onClick={handleSimulatePhoto}
                disabled={photoUploading || capturedPhoto !== null}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-200 rounded-lg border border-slate-750 transition-all active:scale-95 disabled:opacity-50"
              >
                {photoUploading ? t('sendingText') : capturedPhoto ? t('capturedText') : t('discreetCaptureBtn')}
              </button>
            </div>

            {capturedPhoto && (
              <div className="flex items-center space-x-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{capturedPhoto} (Encrypted & Synced to Responders)</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
