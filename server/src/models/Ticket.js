import mongoose from 'mongoose';
import crypto from 'crypto';

const ticketSchema = new mongoose.Schema(
  {
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    ticketTypeId: {
      type: String,
      required: true
    },
    ticketTypeName: {
      type: String,
      required: true
    },
    // Seat / slot info — reserved for future use
    seatLabel: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['valid', 'used', 'cancelled'],
      default: 'valid',
      index: true
    },
    // QR content — filled in M5
    qrData: {
      type: String,
      default: null
    },
    // Gate scan metadata — filled in M6
    scannedAt: {
      type: Date,
      default: null
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

// Generate a human-readable, unique ticket code before validation
ticketSchema.pre('validate', function (next) {
  if (!this.ticketCode) {
    const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.ticketCode = `TKT-${rand}`;
  }
  next();
});

export const Ticket = mongoose.model('Ticket', ticketSchema);
