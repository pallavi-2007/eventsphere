import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Ticket,
  AlertCircle
} from 'lucide-react';
import { formatEventDate } from '../utils/formatters';

export const CheckoutPlaceholder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state;

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cream-100 text-plum flex items-center justify-center mx-auto">
          <Ticket className="w-8 h-8 opacity-60" />
        </div>
        <h2 className="text-xl font-bold text-plum-900">No Active Checkout</h2>
        <p className="text-xs text-neutral-500">Please choose an event and ticket tier to proceed.</p>
        <Link
          to="/user/events"
          className="inline-block mt-2 bg-plum text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow hover:bg-plum-700"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  const platformFee = 49;
  const totalAmount = (order.subtotal || 0) + platformFee;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-plum transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event Details</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-lg space-y-6">
        <div className="border-b border-cream-200 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-plum-50 text-plum text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 2 Milestone Preview</span>
          </div>
          <h1 className="text-2xl font-black text-plum-900">Checkout Preview</h1>
          <p className="text-xs text-neutral-500">Review your ticket selection before payment.</p>
        </div>

        {/* Order Details */}
        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-plum-900">{order.eventTitle}</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{order.eventVenue}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-cream-300 rounded-lg text-plum">
              {order.quantity}x {order.ticketTypeName}
            </span>
          </div>

          <div className="border-t border-cream-200 pt-3 space-y-1.5 text-xs text-neutral-600">
            <div className="flex justify-between">
              <span>Tickets Subtotal</span>
              <span className="font-semibold text-neutral-800">₹{(order.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Booking & Platform Fee</span>
              <span className="font-semibold text-neutral-800">₹{platformFee}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-plum-900 pt-2 border-t border-cream-200">
              <span>Total Payable</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Checkout & Holds (Milestones M3 & M4)</span>
            In Phase 3, selecting checkout triggers a 5-minute Redis hold countdown preventing double-bookings. In Phase 4, Razorpay payment processing and signed QR ticket issuance will activate.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/user/events')}
            className="w-full bg-plum hover:bg-plum-700 text-white font-bold py-3 px-4 rounded-xl shadow-md text-xs transition"
          >
            Explore More Events
          </button>
        </div>
      </div>
    </div>
  );
};
