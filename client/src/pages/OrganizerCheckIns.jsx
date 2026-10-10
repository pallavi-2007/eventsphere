import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import { formatEventDate } from '../utils/formatters';

export const OrganizerCheckIns = () => {
  const [data, setData] = useState({ eventStats: [], fraudLogs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/checkin/organizer/stats');
      if (res.data?.success && res.data.data) {
        setData(res.data.data);
      } else {
        setError('Failed to load check-in statistics');
      }
    } catch (err) {
      console.error('Failed to load check-in stats:', err);
      setError(err.response?.data?.error || 'Unable to retrieve check-in analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalBooked = data.eventStats.reduce((acc, curr) => acc + (curr.booked || 0), 0);
  const totalCheckedIn = data.eventStats.reduce((acc, curr) => acc + (curr.checkedIn || 0), 0);
  const checkInRate = totalBooked > 0 ? Math.round((totalCheckedIn / totalBooked) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-plum/70">Live Admission Stream</span>
          <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight mt-0.5">
            Check-ins & Gate Monitoring
          </h1>
          <p className="text-neutral-500 text-xs md:text-sm mt-1">
            Real-time venue capacity status, entry percentages, and gate fraud detection.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cream-300 hover:bg-cream-50 text-neutral-700 font-bold text-xs transition self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-plum" />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-cream-300 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Booked</span>
            <div className="p-2.5 bg-plum-50 rounded-xl text-plum">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-plum-900 mb-1">{totalBooked}</div>
          <div className="text-[11px] text-neutral-400">Total tickets issued across all events</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-cream-300 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Admitted Guests</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 mb-1">{totalCheckedIn}</div>
          <div className="text-[11px] text-neutral-400">Successfully scanned at gate</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-cream-300 shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Turnout Rate</span>
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-plum-900 mb-1">{checkInRate}%</div>
          <div className="text-[11px] text-neutral-400">Checked-in vs. booked attendees</div>
        </div>
      </div>

      {/* Capacity Overview per Event */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-cream-200">
          <div>
            <h2 className="font-extrabold text-plum-900 text-lg">Per-Event Capacity Overview</h2>
            <p className="text-xs text-neutral-500">Live breakdown of Booked, Checked In, and Remaining tickets</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-neutral-400 text-xs">Loading event capacity metrics...</div>
        ) : data.eventStats.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-xs">No events found in your portfolio.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.eventStats.map((evt) => {
              const bookedPct = evt.totalCapacity > 0 ? Math.round((evt.booked / evt.totalCapacity) * 100) : 0;
              const checkInPct = evt.booked > 0 ? Math.round((evt.checkedIn / evt.booked) * 100) : 0;

              return (
                <div
                  key={evt.eventId}
                  className="p-5 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-plum-900 text-base truncate">{evt.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-plum" />
                          {formatEventDate(evt.dateTime)}
                        </span>
                        <span className="truncate flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-plum" />
                          {evt.venue}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-plum-50 text-plum border border-plum-200 shrink-0">
                      {checkInPct}% in
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-cream-200 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-500"
                        style={{ width: `${evt.totalCapacity > 0 ? (evt.checkedIn / evt.totalCapacity) * 100 : 0}%` }}
                        title="Checked In"
                      />
                      <div
                        className="bg-amber-400 h-full transition-all duration-500"
                        style={{
                          width: `${
                            evt.totalCapacity > 0
                              ? ((evt.booked - evt.checkedIn) / evt.totalCapacity) * 100
                              : 0
                          }%`
                        }}
                        title="Booked (Pending)"
                      />
                    </div>
                  </div>

                  {/* Stat pills */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-cream-200">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase block">Booked</span>
                      <span className="font-extrabold text-neutral-800 text-sm">{evt.booked}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-cream-200">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase block">Checked In</span>
                      <span className="font-extrabold text-emerald-700 text-sm">{evt.checkedIn}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-cream-200">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase block">Remaining</span>
                      <span className="font-extrabold text-neutral-800 text-sm">{evt.remaining}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fraud Log: Rejected Scans */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-cream-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-plum-900 text-lg">Rejected Scans & Fraud Log</h2>
              <p className="text-xs text-neutral-500">
                Audited admission denials (duplicate tickets, forged tokens, expired QR codes)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
            {data.fraudLogs.length} flagged attempts
          </span>
        </div>

        {data.fraudLogs.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-xs">
            No rejected scan attempts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cream-50/80 border-b border-cream-200 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Ticket Ref</th>
                  <th className="py-3 px-4">Rejection Reason</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Gate Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {data.fraudLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-rose-50/30 transition">
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-800 truncate max-w-xs">
                      {log.eventId?.title || 'Unknown Event'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-plum-900">
                      {log.ticketCode || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                        {log.result.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase font-bold text-[10px] text-neutral-500">
                      {log.method}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {log.staffId?.name || 'Gate Scanner'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerCheckIns;
