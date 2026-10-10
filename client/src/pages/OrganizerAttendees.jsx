import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  Calendar,
  Ticket,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { formatEventDate } from '../utils/formatters';

export const OrganizerAttendees = () => {
  const [attendees, setAttendees] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'used' | 'valid'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch organizer events for the dropdown filter
  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/organizer/my-events');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load organizer events:', err);
    }
  };

  // Fetch attendees list
  const fetchAttendees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/checkin/organizer/attendees', {
        params: {
          search: searchQuery || undefined,
          eventId: selectedEventId || undefined,
          status: statusFilter || undefined
        }
      });
      if (res.data?.success) {
        setAttendees(res.data.data);
      } else {
        setError('Failed to load attendees');
      }
    } catch (err) {
      console.error('Failed to load attendees:', err);
      setError(err.response?.data?.error || 'Unable to retrieve attendee roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendees();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedEventId, statusFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-plum/70">Attendee Management</span>
          <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight mt-0.5">
            Event Attendees
          </h1>
          <p className="text-neutral-500 text-xs md:text-sm mt-1">
            Real-time roster, check-in status timestamps, and ticket pass tracking.
          </p>
        </div>

        <button
          onClick={fetchAttendees}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cream-300 hover:bg-cream-50 text-neutral-700 font-bold text-xs transition self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-plum" />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl p-5 border border-cream-300 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by attendee name, email, ticket code, or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-plum-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-plum/20 font-medium"
          />
        </div>

        {/* Event Filter */}
        <div className="shrink-0">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full md:w-56 bg-cream-50 border border-cream-300 rounded-xl px-3 py-2.5 text-xs font-bold text-plum-900 focus:outline-none focus:ring-2 focus:ring-plum/20"
          >
            <option value="">All Events</option>
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="shrink-0 flex gap-1.5 bg-cream-100 p-1 rounded-xl border border-cream-200">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === '' ? 'bg-plum text-white shadow-sm' : 'text-neutral-600 hover:text-plum-900'
            }`}
          >
            All ({attendees.length})
          </button>
          <button
            onClick={() => setStatusFilter('used')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'used' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-600 hover:text-emerald-700'
            }`}
          >
            Checked In
          </button>
          <button
            onClick={() => setStatusFilter('valid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'valid' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-600 hover:text-amber-700'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchAttendees} className="font-bold underline hover:text-rose-950">
            Retry
          </button>
        </div>
      )}

      {/* Attendees Table matching Screen 9 */}
      <div className="bg-white rounded-3xl border border-cream-300 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-plum animate-spin mx-auto" />
            <p className="text-xs text-neutral-400">Loading attendee directory...</p>
          </div>
        ) : attendees.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cream-100 text-plum flex items-center justify-center mx-auto">
              <Users className="w-7 h-7 opacity-60" />
            </div>
            <h3 className="font-bold text-plum-900 text-base">No Attendees Found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              No tickets match your filter criteria or search query. Try choosing another event or clearing filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-cream-50/80 border-b border-cream-200 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="py-4 px-6">Attendee</th>
                  <th className="py-4 px-6">Event</th>
                  <th className="py-4 px-6">Ticket Tier</th>
                  <th className="py-4 px-6">Ticket Code</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Check-in Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {attendees.map((att) => {
                  const isCheckedIn = att.status === 'used';
                  return (
                    <tr key={att._id} className="hover:bg-cream-50/50 transition">
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-plum-900 text-sm">{att.userId?.name || 'Attendee'}</div>
                        <div className="text-[11px] text-neutral-400">{att.userId?.email || '—'}</div>
                      </td>

                      {/* Event */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-bold text-neutral-800 truncate">{att.eventId?.title || '—'}</div>
                        <div className="text-[11px] text-neutral-400">{formatEventDate(att.eventId?.dateTime)}</div>
                      </td>

                      {/* Ticket Type */}
                      <td className="py-4 px-6">
                        <span className="font-bold text-plum bg-plum-50 px-2.5 py-1 rounded-md text-[11px]">
                          {att.ticketTypeName}
                        </span>
                      </td>

                      {/* Ticket Code & Booking Ref */}
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-neutral-900 block">{att.ticketCode}</span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          {att.bookingId?.bookingId || '—'}
                        </span>
                      </td>

                      {/* Status Chip */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isCheckedIn
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCheckedIn ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}
                          />
                          {isCheckedIn ? 'Checked In' : 'Pending'}
                        </span>
                      </td>

                      {/* Check-in Time */}
                      <td className="py-4 px-6 text-neutral-600 font-medium">
                        {att.scannedAt ? (
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-neutral-900 block">
                              {new Date(att.scannedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {new Date(att.scannedAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">Not checked in</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerAttendees;
