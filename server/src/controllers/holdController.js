import { createHold, getHold, releaseHold } from '../services/holdService.js';

export const handleCreateHold = async (req, res, next) => {
  try {
    const { eventId, ticketTypeId, quantity } = req.body;
    if (!eventId || !ticketTypeId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Please provide eventId, ticketTypeId, and quantity.'
      });
    }

    const hold = await createHold(req.user._id, { eventId, ticketTypeId, quantity });
    return res.status(201).json({
      success: true,
      data: hold
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetHold = async (req, res, next) => {
  try {
    const hold = await getHold(req.user._id, req.params.id);
    return res.status(200).json({
      success: true,
      data: hold
    });
  } catch (error) {
    next(error);
  }
};

export const handleReleaseHold = async (req, res, next) => {
  try {
    const result = await releaseHold(req.user._id, req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};
