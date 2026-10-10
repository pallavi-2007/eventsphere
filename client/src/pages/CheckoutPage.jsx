import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Clock,
  ShieldCheck,
  Ticket,
  AlertCircle,
  Calendar,
  MapPin,
  XCircle,
  AlertTriangle,
  Smartphone,
  Building2,
  Wallet,
  CheckCircle2,
  Loader2,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { formatEventDate } from '../utils/formatters';

// ─── Mock Payment Modal ───────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'upi',
    label: 'UPI',
    icon: Smartphone,
    desc: 'PhonePe, Google Pay, Paytm & more',
    placeholder: 'yourname@upi'
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    icon: CreditCard,
    desc: 'Visa, Mastercard, RuPay',
    placeholder: null
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    icon: Building2,
    desc: 'SBI, HDFC, ICICI and 50+ banks',
    placeholder: null
  },
  {
    id: 'wallet',
    label: 'Wallets',
    icon: Wallet,
    desc: 'Mobikwik, FreeCharge, Airtel',
    placeholder: null
  }
];

const PaymentModal = ({ totalAmount, onSuccess, onClose }) => {
  const [selected, setSelected] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [phase, setPhase] = useState('select'); // 'select' | 'processing' | 'done'

  const handlePay = () => {
    setPhase('processing');
    setTimeout(() => {
      setPhase('done');
      setTimeout(() => onSuccess(`mock_pay_${Date.now()}`), 600);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-cream-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-plum px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-plum-200 text-[11px] font-semibold uppercase tracking-wider">Secure Payment</p>
            <p className="text-white font-black text-xl mt-0.5">
              ₹{totalAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={phase !== 'select'}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition disabled:opacity-40"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {phase === 'select' && (
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Choose Payment Method</p>

            <div className="space-y-2">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon, desc, placeholder }) => (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition ${
                    selected === id
                      ? 'border-plum bg-plum-50'
                      : 'border-cream-200 hover:border-plum-200 hover:bg-cream-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selected === id ? 'bg-plum text-white' : 'bg-cream-100 text-neutral-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${selected === id ? 'text-plum-900' : 'text-neutral-800'}`}>{label}</p>
                    <p className="text-xs text-neutral-500 truncate">{desc}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${selected === id ? 'text-plum' : 'text-neutral-300'}`} />
                </button>
              ))}
            </div>

            {selected === 'upi' && (
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">Enter UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum"
                />
              </div>
            )}

            <button
              onClick={handlePay}
              className="w-full bg-plum hover:bg-plum-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-plum/25 transition text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Pay ₹{totalAmount.toLocaleString('en-IN')} Securely
            </button>

            <p className="text-center text-[10px] text-neutral-400">
              Protected by 256-bit SSL encryption
            </p>
          </div>
        )}

        {phase === 'processing' && (
          <div className="px-6 py-16 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full border-4 border-plum-200 border-t-plum animate-spin" />
            <div className="text-center">
              <p className="font-black text-plum-900 text-base">Processing Payment…</p>
              <p className="text-xs text-neutral-500 mt-1">Please do not close this window</p>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="px-6 py-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="font-black text-plum-900 text-base">Payment Successful!</p>
              <p className="text-xs text-neutral-500 mt-1">Confirming your booking…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state;

  const [secondsRemaining, setSecondsRemaining] = useState(order?.secondsLeft ?? 300);
  const [isExpired, setIsExpired] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  // Sync hold time remaining from server if holdId exists
  useEffect(() => {
    if (!order?.holdId) return;
    let isMounted = true;
    const fetchHoldStatus = async () => {
      try {
        const res = await api.get(`/holds/${order.holdId}`);
        if (res.data?.success && res.data.data && isMounted) {
          const left = res.data.data.secondsLeft;
          setSecondsRemaining(left);
          if (left <= 0) setIsExpired(true);
        }
      } catch (err) {
        if (err.response?.status === 404 && isMounted) setIsExpired(true);
      }
    };
    fetchHoldStatus();
    return () => { isMounted = false; };
  }, [order?.holdId]);

  // Countdown timer
  useEffect(() => {
    if (isExpired || !order) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) { clearInterval(timer); setIsExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpired, order]);

  const handleCancelHold = async () => {
    if (!order?.holdId) {
      navigate(order?.eventId ? `/user/events/${order.eventId}` : '/user/events');
      return;
    }
    setCancelling(true);
    try {
      await api.delete(`/holds/${order.holdId}`);
    } catch { /* ignore — navigate anyway */ }
    navigate(order.eventId ? `/user/events/${order.eventId}` : '/user/events');
    setCancelling(false);
  };

  // Called by PaymentModal with a mock paymentId after simulated success
  const handlePaymentSuccess = async (paymentId) => {
    setShowPayModal(false);
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await api.post('/bookings/confirm', {
        holdId: order.holdId,
        paymentId
      });
      if (res.data?.success) {
        navigate('/user/booking-confirmed', {
          replace: true,
          state: {
            booking: res.data.data.booking,
            tickets: res.data.data.tickets,
            event: {
              title: order.eventTitle,
              dateTime: order.eventDateTime,
              venue: order.eventVenue,
              bannerUrl: order.eventBanner
            }
          }
        });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Booking confirmation failed. Please contact support.';
      setConfirmError(msg);
      setConfirming(false);
    }
  };

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cream-100 text-plum flex items-center justify-center mx-auto">
          <Ticket className="w-8 h-8 opacity-60" />
        </div>
        <h2 className="text-xl font-bold text-plum-900">No Active Checkout</h2>
        <p className="text-xs text-neutral-500">Please choose an event and ticket tier to proceed.</p>
        <Link to="/user/events" className="inline-block mt-2 bg-plum text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow hover:bg-plum-700">
          Browse Events
        </Link>
      </div>
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const platformFee = 49;
  const subtotal = order.subtotal || (order.ticketPrice * order.quantity) || 0;
  const totalAmount = subtotal + platformFee;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {showPayModal && (
        <PaymentModal
          totalAmount={totalAmount}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayModal(false)}
        />
      )}

      {/* Back nav */}
      <div>
        <button
          onClick={handleCancelHold}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-plum transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event Details
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-300 shadow-xl space-y-6">
        {/* Header with countdown */}
        <div className="border-b border-cream-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-plum-900 tracking-tight">Checkout</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Complete your ticket booking</p>
          </div>
          {!isExpired ? (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
              <div className="text-left">
                <span className="text-[11px] font-bold text-amber-900 block leading-tight">Complete payment in</span>
                <span className="font-mono font-black text-base text-amber-900 tracking-wider">{timeFormatted}</span>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Hold Expired
            </div>
          )}
        </div>

        {/* Expired state */}
        {isExpired && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">Your hold expired</h3>
              <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
                Tickets held for 5 minutes have been automatically released. Please head back to select tickets again.
              </p>
            </div>
            <button
              onClick={() => navigate(`/user/events/${order.eventId}`)}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition"
            >
              Back to Event
            </button>
          </div>
        )}

        {/* Confirm error */}
        {confirmError && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {confirmError}
          </div>
        )}

        {/* Event summary */}
        <div className="p-4 sm:p-5 rounded-2xl bg-cream-50 border border-cream-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {order.eventBanner && (
            <img src={order.eventBanner} alt={order.eventTitle} className="w-full sm:w-24 h-24 object-cover rounded-xl shadow-sm shrink-0" />
          )}
          <div className="space-y-1.5 min-w-0 flex-1">
            <h2 className="text-lg font-bold text-plum-900 truncate">{order.eventTitle}</h2>
            <div className="space-y-1 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-plum shrink-0" />
                <span>{formatEventDate(order.eventDateTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-plum shrink-0" />
                <span className="truncate">{order.eventVenue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order breakdown */}
        <div className="border border-cream-200 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-plum-900 uppercase tracking-wider">Ticket Summary</h3>
          <div className="flex items-center justify-between py-2 border-b border-cream-100">
            <div>
              <span className="font-bold text-sm text-plum-900 block">{order.ticketTypeName}</span>
              <span className="text-xs text-neutral-400">₹{(order.ticketPrice || 0).toLocaleString('en-IN')} each</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-cream-100 text-plum rounded-lg">Qty: {order.quantity}</span>
          </div>
          <div className="space-y-2 text-xs text-neutral-600 pt-1">
            <div className="flex justify-between">
              <span>Tickets Subtotal</span>
              <span className="font-semibold text-neutral-800">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform & Processing Fee</span>
              <span className="font-semibold text-neutral-800">₹{platformFee}</span>
            </div>
            <div className="flex justify-between text-base font-black text-plum-900 pt-3 border-t border-cream-200">
              <span>Total Amount</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 flex items-start gap-3 text-xs text-neutral-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>Your tickets are reserved. Click Pay to complete your order through our secure payment gateway.</p>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            disabled={isExpired || confirming}
            onClick={() => setShowPayModal(true)}
            className="w-full sm:flex-1 bg-plum hover:bg-plum-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-plum/25 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirming ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Confirming…</span></>
            ) : (
              <><CreditCard className="w-4 h-4" /><span>Pay ₹{totalAmount.toLocaleString('en-IN')}</span></>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancelHold}
            disabled={cancelling || confirming}
            className="w-full sm:w-auto px-6 py-3.5 border border-cream-300 hover:bg-cream-100 text-neutral-700 font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4 text-neutral-400" />
            {cancelling ? 'Releasing...' : 'Cancel Hold'}
          </button>
        </div>
      </div>
    </div>
  );
};
