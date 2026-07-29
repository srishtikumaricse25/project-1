import React, { useEffect, useState } from 'react';

/**
 * SafetyTimer component
 * Starts a countdown (default 20 minutes). When the timer ends, a modal asks
 * "Are you safe?". If the user selects "I'm Safe", the timer stops. If the user
 * selects "Can't Help" or does not respond within 30 seconds, the component
 * automatically triggers an SOS alert via the backend API.
 */
const DEFAULT_DURATION_MS = 20 * 60 * 1000; // 20 minutes

export const SafetyTimer: React.FC = () => {
  const [remainingMs, setRemainingMs] = useState<number>(DEFAULT_DURATION_MS);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  // Countdown effect
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          // Timer finished
          setShowPrompt(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  // Auto‑SOS if no response within 30 seconds
  useEffect(() => {
    if (!showPrompt) return;
    const timeout = setTimeout(() => {
      triggerSOS();
      setShowPrompt(false);
    }, 30_000); // 30 seconds
    return () => clearTimeout(timeout);
  }, [showPrompt]);

  const cancelTimer = () => {
    setTimerActive(false);
    setShowPrompt(false);
  };

  const triggerSOS = async () => {
    try {
      await fetch('/api/alerts/sos', {
        method: 'POST',
        credentials: 'include', // send cookies / auth token
        headers: {
          'Content-Type': 'application/json',
        },
        // body can be empty – backend uses JWT from cookies
      });
    } catch (e) {
      console.error('Failed to trigger SOS', e);
    }
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <>
      {/* Visible countdown timer */}
      {timerActive && (
        <div className="text-sm text-slate-400 mt-2">
          Safety timer: {formatTime(remainingMs)}
        </div>
      )}

      {/* Modal prompt when timer ends */}
      {showPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-slate-900 p-6 rounded-xl shadow-lg w-80">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              Are you safe?
            </h2>
            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                onClick={() => {
                  cancelTimer();
                }}
              >
                I'm Safe
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
                onClick={() => {
                  triggerSOS();
                  cancelTimer();
                }}
              >
                Can't Help
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
