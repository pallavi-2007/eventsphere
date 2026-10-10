import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Calendar,
  MapPin,
  QrCode,
  Download,
  X,
  ExternalLink,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { formatEventDate } from '../utils/formatters';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { downloadTicketPass } from '../utils/downloadTicket';

export const UserTickets = () => {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [ticketsData, setTicketsData] = useState({ upcoming: [], past: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected ticket for the large QR modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/tickets/mine');
      if (res.data?.success && res.data.data) {
        setTicketsData(res.data.data);
      } else {
        setError('Failed to load tickets.');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.error || 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const displayedTickets = activeTab === 'upcoming' ? ticketsData.upcoming : ticketsData.past;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight">My Tickets</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Access your confirmed bookings and dynamic cryptographic QR entry passes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-cream-100 p-1.5 rounded-2xl border border-cream-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-plum text-white shadow-md shadow-plum/20'
                : 'text-neutral-600 hover:text-plum-900'
            }`}
          >
            <span>Upcoming</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-cream-200 text-neutral-600'
              }`}
            >
              {ticketsData.upcoming.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'past'
                ? 'bg-plum text-white shadow-md shadow-plum/20'
                : 'text-neutral-600 hover:text-plum-900'
            }`}
          >
            <span>Past</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'past' ? 'bg-white/20 text-white' : 'bg-cream-200 text-neutral-600'
              }`}
            >
              {ticketsData.past.length}
            </span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTickets}
            className="text-xs font-bold text-rose-700 underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-cream-200 shadow-sm animate-pulse space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-cream-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-cream-200 rounded w-3/4" />
                  <div className="h-3 bg-cream-100 rounded w-1/2" />
                  <div className="h-3 bg-cream-100 rounded w-2/3" />
                </div>
              </div>
              <div className="h-10 bg-cream-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayedTickets.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 border border-cream-300 shadow-sm text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cream-100 text-plum flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-xl font-bold text-plum-900">
            No {activeTab === 'upcoming' ? 'upcoming' : 'past'} tickets found
          </h3>
          <p className="text-neutral-500 text-xs">
            {activeTab === 'upcoming'
              ? 'When you book tickets for concerts, conferences, or workshops, they will appear here with rotating QR passes.'
              : 'You have no completed or archived past event tickets yet.'}
          </p>
        </div>
      ) : (
        /* Tickets Grid matching Screen 6 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedTickets.map((ticket) => {
            const event = ticket.eventId;
            const booking = ticket.bookingId;
            const eventTitle = event?.title || 'Event Pass';
            const eventDate = formatEventDate(event?.dateTime);
            const venue = event?.venue || 'Venue information';
            const bannerUrl = event?.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=600&q=80';

            return (
              <div
                key={ticket._id}
                className="bg-white rounded-3xl p-5 border border-cream-300 hover:border-plum/40 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {/* Event info card top */}
                <div className="flex items-start gap-4">
                  <img
                    src={bannerUrl}
                    alt={eventTitle}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shrink-0 border border-cream-200"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-plum bg-plum-50 px-2 py-0.5 rounded-md">
                        {ticket.ticketTypeName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ticket.status === 'valid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {ticket.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-plum-900 text-base leading-tight truncate">
                      {eventTitle}
                    </h3>

                    <div className="space-y-1 text-xs text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-plum shrink-0" />
                        <span className="truncate">{eventDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-plum shrink-0" />
                        <span className="truncate">{venue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ticket code and booking ref strip */}
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-cream-50 border border-cream-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-tight">
                      Ticket Code
                    </span>
                    <span className="font-mono font-bold text-plum-900">{ticket.ticketCode}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-tight">
                      Booking Ref
                    </span>
                    <span className="font-mono text-neutral-600">{booking?.bookingId || 'EVS-REF'}</span>
                  </div>
                </div>

                {/* Bottom Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex-1 flex items-center justify-center gap-2 bg-plum hover:bg-plum-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-plum/20 transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Ticket</span>
                  </button>

                  <button
                    onClick={() =>
                      downloadTicketPass({
                        eventTitle,
                        eventDate,
                        venue,
                        ticketTypeName: ticket.ticketTypeName,
                        ticketCode: ticket.ticketCode,
                        bookingId: booking?.bookingId
                      })
                    }
                    title="Download offline pass"
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-cream-300 hover:bg-cream-100 text-neutral-700 font-bold text-xs transition shrink-0"
                  >
                    <Download className="w-4 h-4 text-plum" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Larger View Ticket QR Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-cream-300 shadow-2xl space-y-5 relative">
            {/* Close button */}
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-200 text-neutral-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal header */}
            <div className="text-center space-y-1 pr-6 pl-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-plum bg-plum-50 px-2.5 py-1 rounded-full border border-plum/20">
                Gate Entry Pass
              </span>
              <h2 className="text-lg font-black text-plum-900 leading-tight pt-1">
                {selectedTicket.eventId?.title || 'Event Pass'}
              </h2>
              <p className="text-xs text-neutral-500">
                {formatEventDate(selectedTicket.eventId?.dateTime)}
              </p>
            </div>

            {/* Rotating Large QR */}
            <div className="flex flex-col items-center justify-center pt-2">
              <QRCodeDisplay ticketId={selectedTicket._id} size={220} showMeta={true} />
            </div>

            {/* Ticket details pill */}
            <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 space-y-1.5 text-xs text-center">
              <div className="flex justify-between text-neutral-500">
                <span>Tier</span>
                <span className="font-bold text-plum-900">{selectedTicket.ticketTypeName}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Code</span>
                <span className="font-mono font-bold text-plum-900">{selectedTicket.ticketCode}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Booking ID</span>
                <span className="font-mono text-neutral-700">
                  {selectedTicket.bookingId?.bookingId || 'EVS-REF'}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                onClick={() =>
                  downloadTicketPass({
                    eventTitle: selectedTicket.eventId?.title,
                    eventDate: formatEventDate(selectedTicket.eventId?.dateTime),
                    venue: selectedTicket.eventId?.venue,
                    ticketTypeName: selectedTicket.ticketTypeName,
                    ticketCode: selectedTicket.ticketCode,
                    bookingId: selectedTicket.bookingId?.bookingId
                  })
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-cream-300 hover:bg-cream-100 text-neutral-700 font-bold text-xs transition"
              >
                <Download className="w-4 h-4 text-plum" />
                <span>Save Image</span>
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex-1 py-3 rounded-xl bg-plum hover:bg-plum-700 text-white font-bold text-xs shadow-md shadow-plum/25 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
