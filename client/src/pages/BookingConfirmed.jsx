import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Ticket,
  Calendar,
  MapPin,
  Download,
  ArrowLeft,
  LayoutList
} from 'lucide-react';
import { formatEventDate } from '../utils/formatters';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { downloadTicketPass } from '../utils/downloadTicket';

export const BookingConfirmed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  // Guard: if landed here without booking data, redirect
  if (!state?.booking) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cream-100 text-plum flex items-center justify-center mx-auto">
          <Ticket className="w-8 h-8 opacity-60" />
        </div>
        <h2 className="text-xl font-bold text-plum-900">No Booking Found</h2>
        <p className="text-xs text-neutral-500">Navigate from the Checkout page to see your confirmation.</p>
        <Link to="/user/tickets" className="inline-block bg-plum text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow hover:bg-plum-700">
          My Tickets
        </Link>
      </div>
    );
  }

  const { booking, tickets, event } = state;
  const platformFee = booking.platformFee ?? 49;
  const eventTitle = event?.title || booking.eventSnapshot?.title;
  const eventDate = formatEventDate(event?.dateTime || booking.eventSnapshot?.dateTime);
  const eventVenue = event?.venue || booking.eventSnapshot?.venue;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Success hero */}
      <div className="bg-white rounded-3xl p-8 border border-cream-300 shadow-xl text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-11 h-11 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-plum-900 tracking-tight">Booking Confirmed!</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Your dynamic tickets are ready. Show your rotating QR at venue gate check-in.
          </p>
        </div>

        {/* Booking ID */}
        <div className="inline-flex flex-col items-center gap-1 px-6 py-3 rounded-2xl bg-cream-50 border border-cream-200">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Booking Reference</span>
          <span className="font-mono font-black text-plum-900 text-base tracking-wider">{booking.bookingId}</span>
        </div>
      </div>

      {/* Event summary */}
      <div className="bg-white rounded-3xl p-6 border border-cream-300 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-plum-900 uppercase tracking-wider">Event Details</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {(event?.bannerUrl || booking.eventSnapshot?.bannerUrl) && (
            <img
              src={event?.bannerUrl || booking.eventSnapshot?.bannerUrl}
              alt={eventTitle}
              className="w-full sm:w-28 h-20 object-cover rounded-2xl shadow-sm shrink-0"
            />
          )}
          <div className="space-y-2 min-w-0 flex-1">
            <p className="font-extrabold text-plum-900 text-base leading-tight">
              {eventTitle}
            </p>
            <div className="space-y-1 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-plum shrink-0" />
                <span>{eventDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-plum shrink-0" />
                <span className="truncate">{eventVenue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="border-t border-cream-200 pt-4 space-y-2 text-xs text-neutral-600">
          <div className="flex justify-between">
            <span>
              {booking.ticketTypeName} × {booking.quantity}
            </span>
            <span className="font-semibold text-neutral-800">₹{booking.subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform & Processing Fee</span>
            <span className="font-semibold text-neutral-800">₹{platformFee}</span>
          </div>
          <div className="flex justify-between text-sm font-black text-plum-900 pt-2 border-t border-cream-200 mt-2">
            <span>Total Paid</span>
            <span>₹{booking.total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Tickets list with Live QR Codes */}
      <div className="bg-white rounded-3xl p-6 border border-cream-300 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-plum-900 uppercase tracking-wider">
            Your Gate Passes ({tickets.length})
          </h2>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Auto-refresh active
          </span>
        </div>

        <div className="space-y-6">
          {tickets.map((t, idx) => (
            <div
              key={t._id || idx}
              className="p-5 rounded-3xl bg-cream-50/60 border border-cream-200 flex flex-col md:flex-row items-center gap-6 justify-between"
            >
              {/* Ticket Details */}
              <div className="space-y-3 flex-1 min-w-0 w-full text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-plum text-white flex items-center justify-center shrink-0">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-plum-900">{t.ticketTypeName}</p>
                    <p className="font-mono text-xs text-neutral-500 font-semibold">{t.ticketCode}</p>
                  </div>
                </div>

                <div className="text-xs text-neutral-600 space-y-1 pl-1">
                  <p className="text-[11px] text-neutral-500">
                    Booking ID: <span className="font-mono font-bold text-neutral-800">{booking.bookingId}</span>
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Live rotating QR pass prevents counterfeit and gate screenshot abuse.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() =>
                      downloadTicketPass({
                        eventTitle,
                        eventDate,
                        venue: eventVenue,
                        ticketTypeName: t.ticketTypeName,
                        ticketCode: t.ticketCode,
                        bookingId: booking.bookingId
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-cream-300 hover:border-plum text-xs font-bold text-plum shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Ticket
                  </button>
                </div>
              </div>

              {/* Live QR Component */}
              <div className="shrink-0 flex justify-center">
                <QRCodeDisplay ticketId={t._id} size={150} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/user/tickets"
          className="flex-1 flex items-center justify-center gap-2 bg-plum hover:bg-plum-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-plum/25 transition text-sm"
        >
          <LayoutList className="w-4 h-4" />
          View in My Tickets
        </Link>
        <Link
          to="/user/events"
          className="flex-1 flex items-center justify-center gap-2 border border-cream-300 hover:bg-cream-100 text-neutral-700 font-bold py-3.5 rounded-2xl transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>
      </div>
    </div>
  );
};
