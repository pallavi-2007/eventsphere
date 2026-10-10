import {
  getAllEvents,
  getEventById,
  getOrganizerEvents,
  createOrganizerEvent,
  updateOrganizerEvent,
  deleteOrganizerEvent,
  getOrganizerStats
} from '../services/eventService.js';

// Public endpoints
export const getEvents = async (req, res, next) => {
  try {
    const events = await getAllEvents();
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleEvent = async (req, res, next) => {
  try {
    const event = await getEventById(req.params.id);
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// Organizer-only endpoints
export const getMyEvents = async (req, res, next) => {
  try {
    const events = await getOrganizerEvents(req.user._id);
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const { title, description, category, dateTime, venue, bannerUrl, ticketTypes } = req.body;
    
    // Basic validation
    if (!title || !description || !dateTime || !venue) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, description, date/time, and venue.'
      });
    }

    if (!Array.isArray(ticketTypes) || ticketTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one ticket type tier.'
      });
    }

    const event = await createOrganizerEvent(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await updateOrganizerEvent(req.user._id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const result = await deleteOrganizerEvent(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await getOrganizerStats(req.user._id);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
