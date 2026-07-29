import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertTriangle, CheckCircle2, QrCode, Upload, SwitchCamera, Play, Square } from 'lucide-react';
import { EmergencyContact } from '../../types';
import { useI18n } from '../../services/i18n';

interface QrContactScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onContactScanned: (contact: Partial<EmergencyContact>) => void;
}

export const parseQrContact = (qrData: string): Partial<EmergencyContact> | null => {
  try {
    const trimmed = qrData.trim();

    // 1. JSON Format
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      const data = parsed.data || parsed;
      if (data.name || data.phone || data.email) {
        return {
          name: data.name || 'Emergency Contact',
          phone: data.phone || '',
          email: data.email || '',
          relationship: data.relationship || 'Family',
          priority: data.priority === 'PRIMARY' ? 'PRIMARY' : 'SECONDARY',
        };
      }
    }

    // 2. SilentSOS URI / Query Params Format (e.g. silentsos://contact?name=...&phone=...)
    if (trimmed.startsWith('silentsos://') || trimmed.includes('?')) {
      const queryString = trimmed.includes('?') ? trimmed.split('?')[1] : trimmed;
      const params = new URLSearchParams(queryString);
      if (params.has('name') || params.has('phone') || params.has('email')) {
        return {
          name: params.get('name') || 'Emergency Contact',
          phone: params.get('phone') || '',
          email: params.get('email') || '',
          relationship: params.get('relationship') || 'Family',
          priority: (params.get('priority') as any) === 'PRIMARY' ? 'PRIMARY' : 'SECONDARY',
        };
      }
    }

    // 3. vCard / MeCard Format
    if (trimmed.startsWith('BEGIN:VCARD') || trimmed.startsWith('MECARD:')) {
      let name = '';
      let phone = '';
      let email = '';

      const fnMatch = trimmed.match(/(?:FN|N):([^\n;\r]+)/i);
      if (fnMatch) name = fnMatch[1].replace(/;/g, ' ').trim();

      const telMatch = trimmed.match(/TEL(?:;[^:]+)?:([^\n\r;]+)/i);
      if (telMatch) phone = telMatch[1].trim();

      const emailMatch = trimmed.match(/EMAIL(?:;[^:]+)?:([^\n\r;]+)/i);
      if (emailMatch) email = emailMatch[1].trim();

      if (name || phone || email) {
        return {
          name: name || 'Emergency Contact',
          phone: phone || '',
          email: email || '',
          relationship: 'Family',
          priority: 'SECONDARY',
        };
      }
    }
  } catch (e) {
    console.error('Error parsing QR data:', e);
  }
  return null;
};

export const QrContactScanner: React.FC<QrContactScannerProps> = ({
  isOpen,
  onClose,
  onContactScanned,
}) => {
  const { t } = useI18n();
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<Partial<EmergencyContact> | null>(null);
  const [scannedRawText, setScannedRawText] = useState<string | null>(null);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);

  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScannedResult(null);
      setScannedRawText(null);
      setErrorMsg(null);
    } else {
      initCameras();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const initCameras = async () => {
    try {
      setErrorMsg(null);
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        setSelectedCameraId(devices[0].id);
        setCameraPermissionGranted(true);
        startScanner(devices[0].id);
      } else {
        setErrorMsg('No camera hardware detected on this device. You can upload a QR image file below.');
      }
    } catch (err: any) {
      console.warn('Camera permission error:', err);
      setCameraPermissionGranted(false);
      setErrorMsg('Camera access permission was denied or unavailable. Please grant camera permission or upload a QR image file.');
    }
  };

  const startScanner = async (cameraId: string) => {
    try {
      setErrorMsg(null);
      await stopScanner();

      const scanner = new Html5Qrcode('qr-reader-dom-element');
      scannerInstanceRef.current = scanner;

      await scanner.start(
        cameraId || { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedQr(decodedText);
        },
        () => {
          // Ignorable frame decoding attempt failures
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start QR camera scanner:', err);
      setErrorMsg('Failed to initialize camera stream. ' + (err.message || ''));
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerInstanceRef.current) {
      try {
        if (scannerInstanceRef.current.isScanning) {
          await scannerInstanceRef.current.stop();
        }
        await scannerInstanceRef.current.clear();
      } catch (err) {
        console.warn('Error clearing QR scanner instance:', err);
      } finally {
        scannerInstanceRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleDecodedQr = (decodedText: string) => {
    setScannedRawText(decodedText);
    const parsedContact = parseQrContact(decodedText);

    if (parsedContact) {
      stopScanner();
      setScannedResult(parsedContact);
      setErrorMsg(null);
    } else {
      setErrorMsg(`Invalid QR Code content. Scanned text: "${decodedText.substring(0, 45)}...". Please scan a valid SilentSOS emergency contact QR.`);
    }
  };

  const handleCameraChange = (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    if (isScanning) {
      startScanner(newCameraId);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      setErrorMsg(null);
      await stopScanner();

      const html5QrCode = new Html5Qrcode('qr-reader-dom-element');
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();

      handleDecodedQr(decodedText);
    } catch (err: any) {
      console.error('Error scanning QR image file:', err);
      setErrorMsg('Could not detect a valid QR code in the uploaded image file.');
    }
  };

  const handleConfirmImport = () => {
    if (scannedResult) {
      onContactScanned(scannedResult);
      onClose();
    }
  };

  const handleSimulateSampleQr = () => {
    const samplePayload = JSON.stringify({
      name: 'Bihar Emergency Helpdesk',
      phone: '+91 612 221 7824',
      email: 'safety.helpdesk@bihar.gov.in',
      relationship: 'Warden/Security',
      priority: 'PRIMARY',
    });
    handleDecodedQr(samplePayload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Scan Emergency Contact QR</h3>
              <p className="text-xs text-slate-400">Position QR code inside the camera box</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="flex items-start space-x-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-normal">
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Successful Scanned Review Drawer */}
        {scannedResult ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-4 animate-fadeIn">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Valid SilentSOS Contact QR Detected!</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Contact Name</span>
                <p className="font-bold text-white mt-0.5">{scannedResult.name}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Phone Number</span>
                <p className="font-bold text-emerald-400 mt-0.5 font-mono">{scannedResult.phone}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Email Address</span>
                <p className="font-semibold text-slate-300 mt-0.5 truncate">{scannedResult.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Relationship / Priority</span>
                <p className="font-semibold text-cyan-400 mt-0.5">
                  {scannedResult.relationship} ({scannedResult.priority})
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmImport}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95"
              >
                Import to Trusted Contacts
              </button>
              <button
                onClick={() => {
                  setScannedResult(null);
                  if (cameras.length > 0) startScanner(selectedCameraId);
                }}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
              >
                Rescan
              </button>
            </div>
          </div>
        ) : (
          /* Live Scanner Container */
          <div className="space-y-4">
            
            {/* HTML5 QR Camera Render Target DOM Element */}
            <div className="relative flex flex-col items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 p-2 min-h-[260px] overflow-hidden">
              <div id="qr-reader-dom-element" className="w-full max-w-[280px] rounded-xl overflow-hidden" />
              
              {!isScanning && !errorMsg && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 space-y-2">
                  <Camera className="h-8 w-8 animate-pulse text-slate-600" />
                  <span className="text-xs font-semibold">Initializing camera stream...</span>
                </div>
              )}
            </div>

            {/* Camera Controls & Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {cameras.length > 1 && (
                <div className="flex items-center space-x-2">
                  <SwitchCamera className="h-4 w-4 text-slate-400" />
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    {cameras.map((c, i) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2 ml-auto">
                {isScanning ? (
                  <button
                    onClick={stopScanner}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all"
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={() => startScanner(selectedCameraId)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Start Camera</span>
                  </button>
                )}

                {/* Upload QR Image fallback option */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload QR Image</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Payload Simulation Option for QA */}
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Testing without physical camera?</span>
              <button
                onClick={handleSimulateSampleQr}
                className="text-[10px] font-bold text-cyan-400 hover:underline"
              >
                + Load Test QR Payload
              </button>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-3 flex justify-end">
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
