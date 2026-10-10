import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import api from '../services/api';

/**
 * QRCodeDisplay
 * Fetches a short-lived signed JWT every 25 seconds for the ticket and draws the QR code.
 * Displays a countdown bar indicating when the QR code refreshes.
 *
 * @param {string} ticketId - ID of the ticket to fetch signed QR token for
 * @param {number} size - Canvas size in px (default 180)
 * @param {boolean} showMeta - Whether to show the countdown bar and label
 */
export const QRCodeDisplay = ({ ticketId, size = 180, showMeta = true, className = '' }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(25);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  const fetchToken = async () => {
    if (!ticketId) return;
    try {
      const res = await api.get(`/tickets/${ticketId}/qr-token`);
      if (res.data?.success && res.data.data?.qrToken) {
        setToken(res.data.data.qrToken);
        setError(null);
        setSecondsRemaining(25);
      } else {
        setError('Failed to fetch QR pass');
      }
    } catch (err) {
      console.error('Failed to get QR token:', err);
      setError(err.response?.data?.error || 'Unable to load QR token');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and 25s auto-refresh
  useEffect(() => {
    let intervalId;
    fetchToken();

    intervalId = setInterval(() => {
      fetchToken();
    }, 25000);

    return () => clearInterval(intervalId);
  }, [ticketId]);

  // Countdown timer for progress bar
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 25));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [token]);

  // Render QR to canvas when token changes
  useEffect(() => {
    if (token && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        token,
        {
          width: size,
          margin: 1,
          color: {
            dark: '#2d0c26', // plum-950
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        },
        (err) => {
          if (err) {
            console.error('QR render error:', err);
            setError('Could not render QR');
          }
        }
      );
    }
  }, [token, size]);

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 25) * 100));

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* QR Canvas Box */}
      <div
        className="relative bg-white p-3 rounded-2xl border border-cream-300 shadow-sm flex items-center justify-center overflow-hidden"
        style={{ width: size + 24, height: size + 24 }}
      >
        {loading && !token && (
          <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-plum" />
            <span className="text-[11px] font-medium">Generating QR...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center text-rose-500 gap-1.5 p-2">
            <AlertCircle className="w-6 h-6" />
            <span className="text-[11px] font-semibold text-center leading-tight">{error}</span>
            <button
              onClick={() => {
                setLoading(true);
                fetchToken();
              }}
              className="mt-1 text-[10px] text-plum font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{ display: token && !error ? 'block' : 'none' }}
          className="rounded-lg"
        />
      </div>

      {/* Countdown and dynamic refresh info */}
      {showMeta && !error && (
        <div className="w-full mt-3 space-y-1.5" style={{ maxWidth: size + 24 }}>
          {/* Progress bar */}
          <div className="w-full bg-cream-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-plum h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-medium text-neutral-500 px-0.5">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Dynamic Pass
            </span>
            <span className="font-mono text-neutral-600">
              Refreshes in {secondsRemaining}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
