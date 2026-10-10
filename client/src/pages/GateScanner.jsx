import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  CameraOff,
  Search,
  RefreshCw,
  Ticket,
  User,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../services/api';

export const GateScanner = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanResult, setScanResult] = useState(null); // { result, ticket, attendee, event, message }
  const [recentScans, setRecentScans] = useState([]);
  const [processing, setProcessing] = useState(false);

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'gate-qr-reader';

  // Load events for selection
  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEvents(res.data.data);
        if (res.data.data.length > 0 && !selectedEventId) {
          setSelectedEventId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  // Load recent scans
  const fetchRecentScans = async () => {
    try {
      const res = await api.get('/checkin/recent', {
        params: { limit: 15, eventId: selectedEventId || undefined }
      });
      if (res.data?.success) {
        setRecentScans(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load recent scans:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchRecentScans();
  }, [selectedEventId]);

  // Submit scan payload to backend
  const handleCheckIn = async ({ qrToken, ticketCode }) => {
    if (processing) return;
    setProcessing(true);
    setScanResult(null);

    try {
      const res = await api.post('/checkin/scan', {
        qrToken,
        ticketCode,
        targetEventId: selectedEventId || undefined
      });

      const data = res.data?.data;
      setScanResult(data);
      fetchRecentScans();
    } catch (err) {
      console.error('Check-in error:', err);
      setScanResult({
        result: 'invalid',
        message: err.response?.data?.error || 'Verification request failed'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Manual code submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCheckIn({ ticketCode: manualCode.trim() });
    setManualCode('');
  };

  // Start Html5Qrcode camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Scanned successfully!
          handleCheckIn({ qrToken: decodedText });
        },
        (errorMessage) => {
          // Ignore parse errors while camera is reading blank frames
        }
      );
      setScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or enter ticket code manually.');
      setScanning(false);
    }
  };

  // Stop camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.error('Camera stop error:', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-plum/70">Gate Staff Station</span>
          <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight mt-0.5">
            Venue Gate Scanner
          </h1>
          <p className="text-neutral-500 text-xs md:text-sm mt-1">
            Real-time cryptographic ticket verification with atomic anti-duplication protection.
          </p>
        </div>

        {/* Event Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
            Active Event:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setScanResult(null);
            }}
            className="bg-cream-50 border border-cream-300 text-plum-900 font-bold text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-plum/30 max-w-xs"
          >
            <option value="">Any Event (Gate Master Mode)</option>
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Scanning & Result Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scanner Viewport Box */}
          <div className="bg-white rounded-3xl p-6 border border-cream-300 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-4 border-b border-cream-200 mb-4">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-plum" />
                <h2 className="font-extrabold text-plum-900 text-base">Camera QR Scanner</h2>
              </div>
              <button
                onClick={scanning ? stopCamera : startCamera}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                  scanning
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    : 'bg-plum text-white hover:bg-plum-700 shadow-plum/20'
                }`}
              >
                {scanning ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Start Camera</span>
                  </>
                )}
              </button>
            </div>

            {/* Html5Qrcode Reader Container */}
            <div className="relative w-full max-w-md aspect-square bg-neutral-900 rounded-2xl overflow-hidden flex items-center justify-center border border-neutral-800 shadow-inner">
              <div id={scannerContainerId} className="w-full h-full" />
              {!scanning && (
                <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center p-6 text-center text-neutral-300 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 flex items-center justify-center text-plum-300 border border-neutral-700">
                    <Scan className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Camera Offline</h3>
                  <p className="text-xs text-neutral-400 max-w-xs">
                    Click "Start Camera" above to activate device video feed, or manually enter ticket code below.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl w-full max-w-md text-center">
                {cameraError}
              </div>
            )}

            {/* Manual Code Input Bar */}
            <form onSubmit={handleManualSubmit} className="mt-6 w-full max-w-md flex gap-2">
              <input
                type="text"
                placeholder="Enter Ticket Code (e.g. TKT-XXXXXXXX)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={processing}
                className="flex-1 bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-xs font-mono font-bold text-plum-900 focus:outline-none focus:ring-2 focus:ring-plum/30 uppercase placeholder:normal-case placeholder:font-sans"
              />
              <button
                type="submit"
                disabled={processing || !manualCode.trim()}
                className="bg-plum hover:bg-plum-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-plum/20 transition flex items-center gap-1.5 shrink-0"
              >
                {processing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Check In</span>
              </button>
            </form>
          </div>

          {/* Big Result Panel */}
          {scanResult && (
            <div
              className={`rounded-3xl p-6 md:p-8 border shadow-lg transition-all animate-in fade-in zoom-in-95 duration-200 ${
                scanResult.result === 'valid'
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : scanResult.result === 'already_used'
                  ? 'bg-rose-50/90 border-rose-300 text-rose-950'
                  : scanResult.result === 'wrong_event'
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : 'bg-rose-50/90 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-black/10">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      scanResult.result === 'valid'
                        ? 'bg-emerald-600 text-white'
                        : scanResult.result === 'already_used'
                        ? 'bg-rose-600 text-white'
                        : scanResult.result === 'wrong_event'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {scanResult.result === 'valid' && <CheckCircle2 className="w-8 h-8" />}
                    {scanResult.result === 'already_used' && <ShieldAlert className="w-8 h-8" />}
                    {scanResult.result === 'wrong_event' && <AlertTriangle className="w-8 h-8" />}
                    {(scanResult.result === 'invalid' || scanResult.result === 'expired') && (
                      <XCircle className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full inline-block mb-1 ${
                        scanResult.result === 'valid'
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : scanResult.result === 'already_used'
                          ? 'bg-rose-200/80 text-rose-900'
                          : scanResult.result === 'wrong_event'
                          ? 'bg-amber-200/80 text-amber-900'
                          : 'bg-rose-200/80 text-rose-900'
                      }`}
                    >
                      {scanResult.result === 'valid' && 'ACCESS GRANTED'}
                      {scanResult.result === 'already_used' && 'ALREADY CHECKED IN (DUPLICATE)'}
                      {scanResult.result === 'wrong_event' && 'WRONG VENUE / EVENT'}
                      {scanResult.result === 'expired' && 'TOKEN EXPIRED'}
                      {scanResult.result === 'invalid' && 'INVALID TICKET / FORGERY'}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight">
                      {scanResult.result === 'valid'
                        ? 'Valid Ticket Pass'
                        : scanResult.result === 'already_used'
                        ? 'Duplicate Entry Detected'
                        : scanResult.result === 'wrong_event'
                        ? 'Event Mismatch'
                        : 'Entry Denied'}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setScanResult(null)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 transition self-end sm:self-auto"
                >
                  Clear Result
                </button>
              </div>

              {/* Result Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
                {scanResult.attendee && (
                  <div className="bg-white/80 p-4 rounded-2xl border border-black/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Attendee</span>
                    <p className="font-extrabold text-base text-neutral-900">{scanResult.attendee.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{scanResult.attendee.email}</p>
                  </div>
                )}

                {scanResult.ticket && (
                  <div className="bg-white/80 p-4 rounded-2xl border border-black/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Ticket Pass</span>
                    <p className="font-extrabold text-base text-neutral-900">{scanResult.ticket.ticketTypeName}</p>
                    <p className="font-mono text-neutral-600 font-bold">{scanResult.ticket.ticketCode}</p>
                  </div>
                )}

                {scanResult.event && (
                  <div className="bg-white/80 p-4 rounded-2xl border border-black/5 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">Event Title</span>
                    <p className="font-extrabold text-base text-neutral-900 truncate">{scanResult.event.title}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{scanResult.event.venue}</p>
                  </div>
                )}
              </div>

              {/* Message Note */}
              <div className="mt-4 p-3 rounded-xl bg-black/5 text-xs font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 opacity-70" />
                <span>{scanResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Scans Side Panel */}
        <div className="bg-white rounded-3xl p-6 border border-cream-300 shadow-sm flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <div>
              <h3 className="font-black text-plum-900 text-sm">Recent Scans</h3>
              <p className="text-[11px] text-neutral-400">Live gate admission log</p>
            </div>
            <button
              onClick={fetchRecentScans}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-plum hover:bg-cream-100 transition"
              title="Refresh logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[580px] pr-1">
            {recentScans.length === 0 ? (
              <div className="text-center py-16 text-neutral-400 text-xs">
                No scans recorded yet today.
              </div>
            ) : (
              recentScans.map((scan) => {
                const isPass = scan.result === 'valid';
                const isDuplicate = scan.result === 'already_used';

                return (
                  <div
                    key={scan._id}
                    className={`p-3 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3 ${
                      isPass
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : isDuplicate
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isPass ? 'bg-emerald-500' : isDuplicate ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-neutral-900 truncate">
                          {scan.ticketCode || scan.ticketId?.ticketCode || 'UNKNOWN TKT'}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">
                          {scan.result.toUpperCase()} • {scan.method.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-neutral-400 block font-mono">
                        {new Date(scan.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                      <span className="text-[9px] font-bold text-neutral-500">
                        {scan.staffId?.name || 'Gate'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GateScanner;
