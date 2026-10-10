import crypto from 'crypto';
import { redisClient } from '../config/redis.js';
import { Event } from '../models/Event.js';

const HOLD_TTL = 300; // 5 minutes in seconds

// ---------------------------------------------------------------------------
// Lua script: atomically create a hold with lazy cleanup of expired entries
// ---------------------------------------------------------------------------
// KEYS[1] = user_hold:{userId}:{eventId}
// ARGV[1] = holdId
// ARGV[2] = eventId
// ARGV[3] = ticketTypeId
// ARGV[4] = quantity (requested)
// ARGV[5] = remainingQuantity (from MongoDB, passed in by the caller)
// ARGV[6] = holdData JSON string
// ARGV[7] = TTL in seconds
const CREATE_HOLD_LUA = `
-- Step 1: If user already holds something for this event, remove the old hold
local oldHoldId = redis.call('GET', KEYS[1])
if oldHoldId then
  local oldRaw = redis.call('GET', 'hold:' .. oldHoldId)
  if oldRaw then
    local old = cjson.decode(oldRaw)
    redis.call('SREM', 'event_holds:' .. ARGV[2] .. ':' .. old.ticketTypeId, oldHoldId)
  end
  redis.call('DEL', 'hold:' .. oldHoldId)
  redis.call('DEL', KEYS[1])
end

-- Step 2: Lazy-cleanup the SET for this ticket type and sum active holds
local setKey = 'event_holds:' .. ARGV[2] .. ':' .. ARGV[3]
local members = redis.call('SMEMBERS', setKey)
local totalHeld = 0
for _, hid in ipairs(members) do
  local raw = redis.call('GET', 'hold:' .. hid)
  if raw then
    local h = cjson.decode(raw)
    totalHeld = totalHeld + tonumber(h.quantity)
  else
    redis.call('SREM', setKey, hid)
  end
end

-- Step 3: Check availability
local remaining = tonumber(ARGV[5])
local requested = tonumber(ARGV[4])
local available = remaining - totalHeld
if available < requested then
  return cjson.encode({ok = false, available = available})
end

-- Step 4: Create the new hold atomically
local ttl = tonumber(ARGV[7])
redis.call('SET', 'hold:' .. ARGV[1], ARGV[6], 'EX', ttl)
redis.call('SADD', setKey, ARGV[1])
redis.call('SET', KEYS[1], ARGV[1], 'EX', ttl)

return cjson.encode({ok = true})
`;

// ---------------------------------------------------------------------------
// Lua script: get total held quantity for one ticket type (with lazy cleanup)
// ---------------------------------------------------------------------------
// KEYS[1] = event_holds:{eventId}:{ticketTypeId}
const GET_HELD_QTY_LUA = `
local members = redis.call('SMEMBERS', KEYS[1])
local totalHeld = 0
for _, hid in ipairs(members) do
  local raw = redis.call('GET', 'hold:' .. hid)
  if raw then
    local h = cjson.decode(raw)
    totalHeld = totalHeld + tonumber(h.quantity)
  else
    redis.call('SREM', KEYS[1], hid)
  end
end
return totalHeld
`;

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Create (or replace) a ticket hold for a user.
 * Returns hold summary on success; throws 409 if not enough tickets.
 */
export const createHold = async (userId, { eventId, ticketTypeId, quantity }) => {
  if (!redisClient) {
    const err = new Error('Redis is not available. Ticket holds require Redis.');
    err.statusCode = 503;
    throw err;
  }

  const event = await Event.findById(eventId);
  if (!event) {
    const err = new Error('Event not found.');
    err.statusCode = 404;
    throw err;
  }

  const ticketType = event.ticketTypes.id(ticketTypeId);
  if (!ticketType) {
    const err = new Error('Ticket type not found.');
    err.statusCode = 404;
    throw err;
  }

  const qty = Number(quantity);
  if (!qty || qty < 1 || qty > 10) {
    const err = new Error('Quantity must be between 1 and 10.');
    err.statusCode = 400;
    throw err;
  }

  const holdId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + HOLD_TTL * 1000);

  const holdData = {
    holdId,
    eventId: eventId.toString(),
    ticketTypeId: ticketTypeId.toString(),
    userId: userId.toString(),
    quantity: qty,
    unitPrice: ticketType.price,
    totalPrice: ticketType.price * qty,
    ticketTypeName: ticketType.name,
    eventTitle: event.title,
    eventVenue: event.venue,
    eventDateTime: event.dateTime.toISOString(),
    eventBanner: event.bannerUrl,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  const result = await redisClient.eval(
    CREATE_HOLD_LUA,
    1,
    `user_hold:${userId}:${eventId}`,        // KEYS[1]
    holdId,                                   // ARGV[1]
    eventId.toString(),                       // ARGV[2]
    ticketTypeId.toString(),                  // ARGV[3]
    qty.toString(),                           // ARGV[4]
    ticketType.remainingQuantity.toString(),  // ARGV[5]
    JSON.stringify(holdData),                 // ARGV[6]
    HOLD_TTL.toString()                       // ARGV[7]
  );

  const parsed = JSON.parse(result);
  if (!parsed.ok) {
    const err = new Error(
      `Not enough tickets available. Only ${parsed.available} left (including active holds).`
    );
    err.statusCode = 409;
    err.available = parsed.available;
    throw err;
  }

  return {
    holdId,
    expiresAt: expiresAt.toISOString(),
    secondsLeft: HOLD_TTL,
    quantity: qty,
    unitPrice: holdData.unitPrice,
    totalPrice: holdData.totalPrice,
    ticketTypeName: holdData.ticketTypeName,
    eventTitle: holdData.eventTitle,
    eventVenue: holdData.eventVenue,
    eventDateTime: holdData.eventDateTime,
    eventBanner: holdData.eventBanner
  };
};

/**
 * Get a hold by ID, owner-only. Returns hold data + secondsLeft.
 */
export const getHold = async (userId, holdId) => {
  if (!redisClient) {
    const err = new Error('Redis is not available.');
    err.statusCode = 503;
    throw err;
  }

  const raw = await redisClient.get(`hold:${holdId}`);
  if (!raw) {
    const err = new Error('Hold not found or expired.');
    err.statusCode = 404;
    throw err;
  }

  const hold = JSON.parse(raw);
  if (hold.userId !== userId.toString()) {
    const err = new Error('Not authorized to view this hold.');
    err.statusCode = 403;
    throw err;
  }

  const ttl = await redisClient.ttl(`hold:${holdId}`);
  return { ...hold, secondsLeft: Math.max(0, ttl) };
};

/**
 * Release a hold early, owner-only.
 */
export const releaseHold = async (userId, holdId) => {
  if (!redisClient) {
    const err = new Error('Redis is not available.');
    err.statusCode = 503;
    throw err;
  }

  const raw = await redisClient.get(`hold:${holdId}`);
  if (!raw) {
    const err = new Error('Hold not found or already expired.');
    err.statusCode = 404;
    throw err;
  }

  const hold = JSON.parse(raw);
  if (hold.userId !== userId.toString()) {
    const err = new Error('Not authorized to release this hold.');
    err.statusCode = 403;
    throw err;
  }

  // Clean up all three keys atomically via pipeline
  const pipe = redisClient.pipeline();
  pipe.del(`hold:${holdId}`);
  pipe.srem(`event_holds:${hold.eventId}:${hold.ticketTypeId}`, holdId);
  pipe.del(`user_hold:${hold.userId}:${hold.eventId}`);
  await pipe.exec();

  return { message: 'Hold released successfully.' };
};

/**
 * Get total held quantity for a single ticket type (with lazy SET cleanup).
 * Returns 0 if Redis is unavailable.
 */
export const getHeldQuantityForTicketType = async (eventId, ticketTypeId) => {
  if (!redisClient) return 0;
  try {
    const result = await redisClient.eval(
      GET_HELD_QTY_LUA,
      1,
      `event_holds:${eventId}:${ticketTypeId}`
    );
    return Number(result) || 0;
  } catch {
    return 0;
  }
};
