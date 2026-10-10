import { Event } from '../models/Event.js';
import { Ticket } from '../models/Ticket.js';
import { getHeldQuantityForTicketType } from './holdService.js';

export const attachAvailableQuantities = async (event) => {
  const eventObj = event.toObject ? event.toObject() : { ...event };
  if (Array.isArray(eventObj.ticketTypes)) {
    const updatedTicketTypes = await Promise.all(
      eventObj.ticketTypes.map(async (t) => {
        const held = await getHeldQuantityForTicketType(eventObj._id, t._id);
        const available = Math.max(0, (t.remainingQuantity ?? t.quantity ?? 0) - held);
        return {
          ...t,
          holdQuantity: held,
          availableQuantity: available,
          // remainingQuantity reflects available tickets for attendee views
          remainingQuantity: available
        };
      })
    );
    eventObj.ticketTypes = updatedTicketTypes;
  }
  return eventObj;
};

// Public Services
export const getAllEvents = async () => {
  const events = await Event.find({ status: 'published' }).sort({ dateTime: 1 });
  return await Promise.all(events.map((e) => attachAvailableQuantities(e)));
};

export const getEventById = async (id) => {
  const event = await Event.findById(id);
  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }
  return await attachAvailableQuantities(event);
};

// Organizer Services
export const getOrganizerEvents = async (organizerId) => {
  return await Event.find({ organizer: organizerId }).sort({ createdAt: -1 });
};

export const createOrganizerEvent = async (organizerId, eventData) => {
  const { title, description, category, dateTime, venue, bannerUrl, ticketTypes, status } = eventData;

  // Process ticket tiers to initialize remainingQuantity & holdQuantity
  const formattedTicketTypes = (ticketTypes || []).map((t) => {
    const qty = Number(t.quantity) || 1;
    return {
      name: t.name?.trim(),
      price: Number(t.price) || 0,
      quantity: qty,
      remainingQuantity: t.remainingQuantity !== undefined ? Number(t.remainingQuantity) : qty,
      holdQuantity: Number(t.holdQuantity) || 0
    };
  });

  const newEvent = await Event.create({
    title,
    description,
    category: category || 'Music',
    dateTime: new Date(dateTime),
    venue,
    bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
    organizer: organizerId,
    ticketTypes: formattedTicketTypes,
    status: status || 'published'
  });

  return newEvent;
};

export const updateOrganizerEvent = async (organizerId, eventId, updateData) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  if (event.organizer?.toString() !== organizerId.toString()) {
    const error = new Error('Not authorized to modify this event.');
    error.statusCode = 403;
    throw error;
  }

  // Update fields if provided
  if (updateData.title !== undefined) event.title = updateData.title;
  if (updateData.description !== undefined) event.description = updateData.description;
  if (updateData.category !== undefined) event.category = updateData.category;
  if (updateData.dateTime !== undefined) event.dateTime = new Date(updateData.dateTime);
  if (updateData.venue !== undefined) event.venue = updateData.venue;
  if (updateData.bannerUrl !== undefined) event.bannerUrl = updateData.bannerUrl;
  if (updateData.status !== undefined) event.status = updateData.status;

  if (Array.isArray(updateData.ticketTypes)) {
    event.ticketTypes = updateData.ticketTypes.map((t) => {
      const qty = Number(t.quantity) || 1;
      return {
        _id: t._id,
        name: t.name?.trim(),
        price: Number(t.price) || 0,
        quantity: qty,
        remainingQuantity: t.remainingQuantity !== undefined ? Number(t.remainingQuantity) : qty,
        holdQuantity: Number(t.holdQuantity) || 0
      };
    });
  }

  await event.save();
  return event;
};

export const deleteOrganizerEvent = async (organizerId, eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  if (event.organizer?.toString() !== organizerId.toString()) {
    const error = new Error('Not authorized to delete this event.');
    error.statusCode = 403;
    throw error;
  }

  await Event.findByIdAndDelete(eventId);
  return { success: true, message: 'Event successfully deleted.' };
};

export const getOrganizerStats = async (organizerId) => {
  const now = new Date();

  const totalEvents = await Event.countDocuments({ organizer: organizerId });
  const upcomingEvents = await Event.countDocuments({
    organizer: organizerId,
    dateTime: { $gte: now },
    status: { $ne: 'cancelled' }
  });

  const organizerEvents = await Event.find({ organizer: organizerId }).select('_id').lean();
  const eventIds = organizerEvents.map(e => e._id);

  // Total attendees = tickets sold across organizer's events (status 'valid' or 'used')
  const totalAttendees = await Ticket.countDocuments({
    eventId: { $in: eventIds },
    status: { $in: ['valid', 'used'] }
  });

  // Check-ins today: tickets scanned today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const checkInsToday = await Ticket.countDocuments({
    eventId: { $in: eventIds },
    status: 'used',
    scannedAt: { $gte: startOfDay }
  });

  const recentEvents = await Event.find({ organizer: organizerId })
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    totalEvents,
    upcomingEvents,
    totalAttendees,
    checkInsToday,
    recentEvents
  };
};
