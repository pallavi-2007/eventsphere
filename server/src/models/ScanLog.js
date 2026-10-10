import mongoose from 'mongoose';

const scanLogSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
      index: true
    },
    ticketCode: {
      type: String,
      default: null,
      index: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    result: {
      type: String,
      enum: ['valid', 'already_used', 'invalid', 'expired', 'wrong_event'],
      required: true,
      index: true
    },
    method: {
      type: String,
      enum: ['qr', 'manual'],
      required: true
    },
    rawInput: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const ScanLog = mongoose.model('ScanLog', scanLogSchema);
