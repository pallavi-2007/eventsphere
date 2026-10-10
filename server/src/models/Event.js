import mongoose from 'mongoose';

const ticketTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Ticket type name is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Ticket price is required'],
      min: [0, 'Price must be positive']
    },
    quantity: {
      type: Number,
      required: [true, 'Ticket quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: [0, 'Remaining quantity cannot be negative']
    },
    holdQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Hold quantity cannot be negative']
    }
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['Music', 'Conferences', 'Workshops', 'Festivals', 'Comedy', 'Networking', 'Other'],
      default: 'Music'
    },
    dateTime: {
      type: Date,
      required: [true, 'Event date and time is required']
    },
    venue: {
      type: String,
      required: [true, 'Venue address or location is required'],
      trim: true
    },
    bannerUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80'
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    ticketTypes: [ticketTypeSchema],
    status: {
      type: String,
      enum: ['draft', 'published', 'completed', 'cancelled'],
      default: 'published'
    }
  },
  {
    timestamps: true
  }
);

export const Event = mongoose.model('Event', eventSchema);
