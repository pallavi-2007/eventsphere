import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,      // readable public ID, e.g. EVS-20261010-ABCD1234
      index: true
    },
    holdId: {
      type: String,
      unique: true,
      sparse: true,
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
      required: true,
      index: true
    },
    ticketTypeId: {
      type: String,   // subdocument _id as string
      required: true
    },
    ticketTypeName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    platformFee: {
      type: Number,
      required: true,
      default: 49
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    orderId: {
      type: String,
      required: true,
      unique: true    // idempotency key — prevents double-booking from the same order
    },
    paymentId: {
      type: String,
      required: true
    },
    paymentProvider: {
      type: String,
      default: 'mock'
    },
    status: {
      type: String,
      enum: ['paid', 'refunded', 'cancelled'],
      default: 'paid'
    },
    // Snapshot of event info at booking time (event may be edited later)
    eventSnapshot: {
      title: String,
      dateTime: Date,
      venue: String,
      bannerUrl: String
    }
  },
  { timestamps: true }
);

export const Booking = mongoose.model('Booking', bookingSchema);
