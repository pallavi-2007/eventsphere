/**
 * Payment provider abstraction.
 *
 * The booking code only calls `createOrder` and `confirmPayment`.
 * To switch to a real provider (e.g. Razorpay), create a new provider object
 * that matches the same interface and swap `activeProvider` below — no
 * changes needed in bookingService or controllers.
 */

import crypto from 'crypto';

// ─── Mock provider ────────────────────────────────────────────────────────────
// Suitable for development and testing. All calls succeed instantly.
const mockProvider = {
  name: 'mock',

  /**
   * Create a payment order.
   * @param {object} opts
   * @param {number} opts.amountPaise  Amount in smallest currency unit (paise for INR).
   * @param {string} opts.currency     ISO 4217 code, e.g. 'INR'.
   * @param {string} opts.receiptId    Internal reference (booking / hold ID).
   * @returns {Promise<{orderId: string, provider: string}>}
   */
  async createOrder({ amountPaise, currency = 'INR', receiptId }) {
    // In production: call Razorpay / Stripe / etc. and return their order ID.
    // Deterministic orderId per receipt/hold prevents multiple orderIds for the same hold
    const orderId = receiptId
      ? `mock_ord_${crypto.createHash('sha256').update(String(receiptId)).digest('hex').slice(0, 16)}`
      : `mock_ord_${crypto.randomBytes(8).toString('hex')}`;
    return { orderId, provider: 'mock' };
  },

  /**
   * Verify / confirm a completed payment.
   * @param {object} opts
   * @param {string} opts.orderId    The order ID returned by createOrder.
   * @param {string} opts.paymentId  Payment ID returned by the client/gateway.
   * @param {string} [opts.signature] Signature for verification (Razorpay style).
   * @returns {Promise<{verified: boolean, paymentId: string}>}
   */
  async confirmPayment({ orderId, paymentId }) {
    // In production: verify the gateway signature here.
    const resolvedPaymentId = paymentId || `mock_pay_${crypto.randomBytes(8).toString('hex')}`;
    return { verified: true, paymentId: resolvedPaymentId };
  }
};

// ─── Razorpay provider stub ───────────────────────────────────────────────────
// Uncomment and fill in when you have Razorpay credentials.
/*
import Razorpay from 'razorpay';
import { config } from '../config/env.js';

const razorpay = new Razorpay({
  key_id: config.razorpayKeyId,
  key_secret: config.razorpayKeySecret
});

const razorpayProvider = {
  name: 'razorpay',
  async createOrder({ amountPaise, currency, receiptId }) {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: receiptId
    });
    return { orderId: order.id, provider: 'razorpay' };
  },
  async confirmPayment({ orderId, paymentId, signature }) {
    const body = orderId + '|' + paymentId;
    const expected = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(body)
      .digest('hex');
    const verified = expected === signature;
    if (!verified) throw Object.assign(new Error('Payment signature verification failed.'), { statusCode: 400 });
    return { verified: true, paymentId };
  }
};
*/

// ─── Active provider ──────────────────────────────────────────────────────────
// Swap `mockProvider` → `razorpayProvider` when going live.
export const paymentService = mockProvider;
