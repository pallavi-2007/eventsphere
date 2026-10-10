import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { formatEventDate, formatPriceRange } from '../utils/formatters';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Tag, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Minus, 
  ShieldCheck, 
  CreditCard,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';

export const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTierIndex, setSelectedTierIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [holdLoading, setHoldLoading] = useState(false);
  const [holdError, setHoldError] = useState(null);

  const fetchEventDetails = async () => {
    setLoading(true);
    setError(null);
    setHoldError(null);
    try {
      const res = await api.get(`/events/${id}`);
      if (res.data?.success && res.data.data) {
        setEvent(res.data.data);
        // Default selected tier
        if (res.data.data.ticketTypes?.length > 0) {
          setSelectedTierIndex(0);
        }
      } else {
        setError('Event not found');
      }
    } catch (err) {
      console.error('Failed to load event details:', err);
      setError(err.response?.data?.error || 'Unable to load event details. Please verify the URL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const selectedTicket = event?.ticketTypes?.[selectedTierIndex] || null;
  const maxAvailable = selectedTicket?.remainingQuantity ?? 0;
  const isSoldOut = maxAvailable <= 0;

  const handleIncrement = () => {
    if (quantity < Math.min(maxAvailable, 10)) {
      setQuantity((prev) => prev + 1);
      setHoldError(null);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
      setHoldError(null);
    }
  };

  const handleTierSelect = (index) => {
    setSelectedTierIndex(index);
    setQuantity(1);
    setHoldError(null);
  };

  const handleProceedToCheckout = async () => {
    if (!selectedTicket || isSoldOut || holdLoading) return;

    setHoldLoading(true);
    setHoldError(null);

    try {
      const res = await api.post('/holds', {
        eventId: event._id,
        ticketTypeId: selectedTicket._id,
        quantity: quantity
      });

      if (res.data?.success && res.data.data) {
        const hold = res.data.data;
        navigate('/user/checkout', {
          state: {
            holdId: hold.holdId,
            eventId: event._id,
            eventTitle: hold.eventTitle || event.title,
            eventVenue: hold.eventVenue || event.venue,
            eventDateTime: hold.eventDateTime || event.dateTime,
            eventBanner: hold.eventBanner || event.bannerUrl,
            ticketTypeId: selectedTicket._id,
            ticketTypeName: hold.ticketTypeName || selectedTicket.name,
            ticketPrice: hold.unitPrice || selectedTicket.price,
            quantity: hold.quantity || quantity,
            subtotal: hold.totalPrice || selectedTicket.price * quantity,
            expiresAt: hold.expiresAt,
            secondsLeft: hold.secondsLeft || 300
          }
        });
      }
    } catch (err) {
      console.error('Hold creation error:', err);
      const msg = err.response?.data?.error || 'Unable to reserve tickets right now. Please try again.';
      setHoldError(msg);
      // Refresh event details to reflect updated live remaining/hold counts
      try {
        const updatedRes = await api.get(`/events/${id}`);
        if (updatedRes.data?.success && updatedRes.data.data) {
          setEvent(updatedRes.data.data);
        }
      } catch (refreshErr) {
        // Ignore refresh err
      }
    } finally {
      setHoldLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-12 h-12 border-4 border-plum-300 border-t-plum rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-plum-900">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-plum-900">Event Not Found</h2>
        <p className="text-xs text-neutral-500">{error || 'This event could not be retrieved.'}</p>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            to="/user/events"
            className="bg-plum text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:bg-plum-700"
          >
            Back to Events
          </Link>
          <button
            onClick={fetchEventDetails}
            className="border border-cream-300 text-neutral-700 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-cream-100"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Link
          to="/user/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-plum transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Main Grid: Left Event Details, Right Ticket Booking Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Banner, Title, Info, Description */}
        <div className="lg:col-span-7 space-y-6">
          {/* Banner */}
          <div className="relative rounded-3xl overflow-hidden bg-neutral-900 shadow-md aspect-video sm:h-80 w-full">
            <img
              src={event.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80'}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-plum text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {event.category || 'Live Event'}
            </div>
            <div className="absolute top-4 right-4 z-10">
              <FavoriteButton eventId={event._id} size={20} className="p-2.5 shadow-md" />
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm space-y-4">
            <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight leading-snug">
              {event.title}
            </h1>

            <div className="space-y-2.5 text-xs sm:text-sm text-neutral-600 border-y border-cream-200 py-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-plum shrink-0" />
                <span className="font-semibold text-neutral-800">{formatEventDate(event.dateTime)}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-plum shrink-0" />
                <span className="text-neutral-700">{event.venue}</span>
              </div>
            </div>

            {/* About Section */}
            <div>
              <h2 className="text-base font-bold text-plum-900 mb-2">About Event</h2>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Ticket Selection Card (Matches Screen 3 & 4) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-cream-300 shadow-lg space-y-6">
            <div>
              <h2 className="text-lg font-bold text-plum-900 tracking-tight">Select Ticket Type</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Pick your tier and choose ticket quantity</p>
            </div>

            {/* Ticket Tiers */}
            <div className="space-y-3">
              {event.ticketTypes?.map((ticket, index) => {
                const isSelected = selectedTierIndex === index;
                const remaining = ticket.remainingQuantity ?? 0;
                const soldOut = remaining <= 0;

                return (
                  <button
                    key={ticket._id || index}
                    type="button"
                    disabled={soldOut}
                    onClick={() => handleTierSelect(index)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      soldOut 
                        ? 'opacity-50 cursor-not-allowed bg-neutral-50 border-neutral-200' 
                        : isSelected
                          ? 'bg-plum-50/70 border-plum text-plum shadow-sm ring-2 ring-plum/20'
                          : 'bg-white border-cream-300 hover:border-plum-200 hover:bg-cream-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-plum-900">{ticket.name}</span>
                        {/* "N left" badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          soldOut 
                            ? 'bg-neutral-200 text-neutral-600'
                            : remaining < 50 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {soldOut ? 'Sold Out' : `${remaining} left`}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">Single admission pass</div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-base text-plum-900 block">
                        ₹{(ticket.price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quantity Selector */}
            {selectedTicket && !isSoldOut && (
              <div className="p-4 rounded-2xl bg-cream-100 border border-cream-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">Quantity</span>
                  <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl border border-cream-300 shadow-sm">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-plum-50 text-plum disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-bold text-plum-900 min-w-4 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={quantity >= Math.min(maxAvailable, 10)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-plum-50 text-plum disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-cream-200">
                  <span>Subtotal</span>
                  <span className="font-extrabold text-sm text-plum-900">
                    ₹{((selectedTicket.price || 0) * quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {/* Hold error banner */}
            {holdError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{holdError}</p>
                </div>
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              type="button"
              onClick={handleProceedToCheckout}
              disabled={!selectedTicket || isSoldOut || holdLoading}
              className="w-full bg-plum hover:bg-plum-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-plum/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {holdLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Reserving Tickets...</span>
                </>
              ) : (
                <span>{isSoldOut ? 'Tickets Sold Out' : 'Proceed to Checkout'}</span>
              )}
            </button>

            {/* Value guarantee note */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Official passes verified with instant QR gate check-in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
