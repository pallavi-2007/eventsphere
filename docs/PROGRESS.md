# EventSphere Project Progress

## Milestone M0: Setup & Infrastructure (Completed)
- [x] Monorepo structure with `/client` and `/server`.
- [x] `docker-compose.yml` for MongoDB single-node replica set (`rs0`) and Redis.
- [x] Server skeleton: config, models, routes, controllers, services, middleware.
- [x] Resilient DB & optional Redis configuration with `/health` endpoint.
- [x] Git repository initialized, `.env.example`, `.gitignore`, and `README.md`.

## Milestone M1: Auth & Role Layouts (Completed)
- [x] JWT authentication with bcrypt password hashing.
- [x] Role guards for `organizer`, `user`, and `gate`.
- [x] Split-layout Login page with 1-click demo role prefill and user registration.
- [x] Role-based routing:
  - Organizer portal (`/organizer/*`) with sidebar.
  - Attendee portal (`/user/*`) with sidebar.
  - Gate Scanner station (`/gate/*`) single-page layout.
- [x] Top profile bar with user details, role badge, and Logout.
- [x] Bottom-left "EventSphere · Secure · Scalable · Built for Real Events" badge.
- [x] Seeding script with 3 demo accounts and 6 sample events.

## Milestone M2: Events (Completed)
- [x] Step 1: User Home page with Search, Sunset Hero, Featured Events, Popular Events filter chips, "Why choose EventSphere" strip, loading & error states.
- [x] Step 2: User All Events listing page with search & category filters matching UI design.
- [x] Step 3: Event Details page (`/user/events/:id`) with ticket tier selector ("N left"), quantity picker, and Proceed to Checkout placeholder.
- [x] Step 4: Organizer backend endpoints — `GET /organizer/my-events`, `GET /organizer/stats`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id` (organizer-only guards). Stats return real counts (totalEvents, upcomingEvents); totalAttendees and checkInsToday return 0 until M4/M5.
- [x] Step 5: Organizer Dashboard displaying real stats (4 cards) and Recent Events list with View button linked to event detail.
- [x] Step 6: Organizer My Events — paginated event list with banner thumbnail, category chip, status badge, price range, Edit and Delete buttons. Empty state with Create prompt.
- [x] Step 7: Create/Edit Event modal — title, description, category, status, dateTime, venue, bannerUrl, dynamic ticket tiers (name/price/quantity with Add/Remove), required-field validation, inline error, Save/Cancel.

### API Smoke Test (run 2026-10-10)
- `GET /health` → `{status:"healthy", database:"connected"}` ✅
- `POST /api/auth/login` (organizer) → JWT token ✅
- `GET /api/events` → 6 events ✅
- `GET /api/events/organizer/my-events` (authenticated) → 6 events ✅
- `GET /api/events/organizer/stats` → `{totalEvents:6, upcomingEvents:6}` ✅
- `POST /api/events` → event created ✅
- `PUT /api/events/:id` → title updated ✅
- `DELETE /api/events/:id` → deleted ✅
- `vite build` → exit 0, 1993 modules ✅

## Milestone M3: Ticket Holds & Checkout (Completed)
- [x] Step 1: Upstash Redis connection verified via `REDIS_URL` in `server/.env`; `/health` returns `{redis: "connected"}`.
- [x] Step 2: Atomic Lua script holds in Redis (`POST /api/holds`): checks remaining capacity against active holds, writes hold with 5-minute TTL, lazily prunes expired hold IDs from SETs so expired holds never count against availability.
- [x] Step 3: Owner-guarded `GET /api/holds/:id` returning hold details and live `secondsLeft`.
- [x] Step 4: Owner-guarded `DELETE /api/holds/:id` for early release (cleans hold key, SET membership, and user hold index).
- [x] Step 5: Event queries (`GET /api/events`, `GET /api/events/:id`) dynamically subtract active holds from `remainingQuantity` to compute live `availableQuantity`. Expired holds automatically free up.
- [x] Step 6: One active hold per user per event constraint enforced atomically in Lua script.
- [x] Step 7: Event Details page Proceed to Checkout calls `POST /api/holds`, displays clear inline error messages on insufficient inventory, and transitions to Checkout with hold data.
- [x] Step 8: Checkout page matching UI Screen 4: event summary, ticket breakdown, fee calculation, live countdown timer ("Complete payment in mm:ss"), early cancellation button, placeholder Pay button, and "Your hold expired" state with back-to-event navigation.

### M3 Integration & Concurrency Test Results
- `/health` → `{services: {api: "up", database: "connected", redis: "connected"}}` ✅
- User A holds 2 of 2 tickets → succeeds ✅
- User B tries holding 1 ticket on same pool → rejected with HTTP 409 (`Not enough tickets available. Only 0 left`) ✅
- User A views hold → succeeds (owner); User B views User A hold → HTTP 403 Forbidden ✅
- User A creates new hold on same event → previous hold atomically replaced ✅
- User B holds newly freed ticket → succeeds ✅
- Early release (`DELETE /api/holds/:id`) → tickets freed immediately ✅
- Redis TTL expiry + Lua lazy SET cleanup → expired holds automatically freed and pruned from SET ✅
- Frontend build (`npm run build`) → exit 0, 1993 modules transformed ✅

## Milestone M4: Payment and Booking (Completed)
- [x] Part 1: Payment provider abstraction in `server/src/services/paymentService.js` with `mock` provider (`createOrder`, `confirmPayment`) and Razorpay adapter stub for seamless swap without modifying booking logic.
- [x] Part 2: Mock payment popup modal on `CheckoutPage.jsx` supporting UPI, Credit/Debit Card, Net Banking, and Wallets with 1.5s simulated processing and neutral payment notice in the plum palette theme.
- [x] Part 3: Transactional booking confirmation endpoint (`POST /api/bookings/confirm`, user protected) with:
  - Active hold ownership verification and 410 rejection for expired holds.
  - Single atomic MongoDB transaction: generates readable `bookingId` (`EVS-YYYYMMDD-XXXX`), decrements `remainingQuantity` on the ticket type, persists Booking record with price breakdown and event snapshot, and generates unique `ticketCode` per quantity in Ticket records.
  - Idempotency on `holdId` and `orderId`: duplicate requests return the existing booking and tickets without extra charges or duplicate inventory decrement.
  - Redis hold cleanup strictly executed post-transaction commit.
  - Automatic rollback on any transactional failure.
- [x] Part 4: `BookingConfirmed.jsx` page displaying success hero, booking reference, event summary, price breakdown, individual tickets with codes, and navigation buttons to "View My Tickets" and "Back to Events". Routed under `/user/booking-confirmed`.
- [x] Part 5: Automated test suite in `server/src/scripts/testM4.js` validating:
  - (a) Double-submit makes exactly one booking (idempotency) ✅
  - (b) Expired hold is rejected with status 410 and creates nothing ✅
  - (c) remainingQuantity drops exactly once ✅
  - (d) Forced failure inside transaction rolls back completely and leaves no partial data ✅
  - Frontend build (`npm run build`) → exit 0, 1994 modules transformed ✅

## Milestone M5: Signed QR Tickets (Completed)
- [x] Part 1: QR_SECRET added to server environment configuration (`server/src/config/env.js`).
- [x] Part 2: `GET /api/tickets/mine` (user only) returning tickets with event details, ticket type, status, and booking ID, split into upcoming and past.
- [x] Part 3: `GET /api/tickets/:id/qr-token` (owner only) generating short-lived signed JWT (30s) with `ticketId` and `eventId`, signed with `QR_SECRET`. Refuses non-valid tickets (used/cancelled).
- [x] Part 4: `verifyQrToken` function in `ticketService.js` verifying signature, expiration, and ticket validity. Automated test suite in `server/src/scripts/testM5.js` passed (tested genuine, forged, expired, and used/cancelled tickets) ✅
- [x] Part 5: QR display component (`client/src/components/QRCodeDisplay.jsx`) with 25s auto-token refresh, countdown indicator bar, and dynamic canvas rendering. Integrated into `BookingConfirmed.jsx` and `UserTickets.jsx` (Screen 6 design with Upcoming/Past tabs, ticket cards, and large View Ticket modal).
- [x] Part 6: "Download Ticket" button (`client/src/utils/downloadTicket.js`) saving a clean PNG ticket pass (event details, ticket type, booking ID, ticket code) with on-screen-only dynamic QR security notice.

## Milestone M6: Check-in and Organizer Pages (Completed)
- [x] Part 1: `POST /api/checkin/scan` (gate staff & organizer) atomic single DB update (`findOneAndUpdate` on `{ _id, status: 'valid' }`) preventing double scan abuse with distinct responses: `valid`, `already_used`, `invalid`, `expired`, `wrong_event`.
- [x] Part 2: `ScanLog` model and automatic logging on every attempt (valid and rejected scans form the fraud log).
- [x] Part 3: `GET /api/checkin/recent` returning latest scan audit events for gate staff and organizers.
- [x] Part 4: Organizer endpoints: `GET /api/checkin/organizer/attendees` with search & filters, `GET /api/checkin/organizer/stats` (capacity & fraud log), and real metrics in `GET /api/events/organizer/stats` (`totalAttendees` and `checkInsToday`).
- [x] Part 5: Gate Scanner page (`client/src/pages/GateScanner.jsx`) with live camera QR scanning (`html5-qrcode`), manual code input, large color-coded result panel (Valid / Already Used / Invalid / Expired / Wrong Event), active event switcher, and Recent Scans list.
- [x] Part 6: Organizer Attendees page (`client/src/pages/OrganizerAttendees.jsx`) matching Screen 9 with table, ticket type, status chip (Checked In / Pending), check-in time, and real-time search & filters.
- [x] Part 7: Organizer Check-ins page (`client/src/pages/OrganizerCheckIns.jsx`) with per-event capacity cards (booked, checked in, remaining) and rejected scans fraud log table.
- [x] Part 8: Organizer Dashboard (`client/src/pages/OrganizerDashboard.jsx`) showing real total attendees (tickets sold) and today's gate check-in counts.
- [x] Part 9: Verification test suite (`server/src/scripts/testM6.js`) verifying concurrency (two simultaneous scans produce exactly 1 success and 1 already_used), forged/expired token rejection, wrong event rejection, and scan logging ✅

## Favorites (Completed)
- [x] Backend 1 & 2: `Favorite` model with unique compound index `{ userId, eventId }`. Endpoints `GET /api/favorites`, `GET /api/favorites/ids`, `POST /api/favorites/:eventId` (idempotent), and `DELETE /api/favorites/:eventId` (user protected). Automated test suite (`server/src/scripts/testFavorites.js`) passed (6/6 tests) ✅
- [x] Frontend 3 & 5: Global `FavoritesContext` (`client/src/context/FavoritesContext.jsx`) loading user's favorite IDs once after login. Instant optimistic UI heart toggle with toast rollback on error. Heart buttons integrated on Home Featured & Popular cards, Events listing, and Event Details banner.
- [x] Frontend 4: Favorites page (`client/src/pages/UserFavorites.jsx`) displaying responsive grid of saved event cards, active heart removal, and empty state with "Explore Events" button.

## User Profile (Completed)
- [x] Backend 1 & 2: `PATCH /api/auth/me` updating only user's name with trimmed 2-50 character validation (email, role, password immutable). `GET /api/profile/summary` returning real metrics (`totalTickets`, `upcomingEvents`, `totalSpent`, `favoritesCount`). Automated test suite (`server/src/scripts/testProfile.js`) passed (4/4 tests) ✅
- [x] Frontend 3-7: Profile page (`client/src/pages/UserProfile.jsx`) with avatar initial circle, user metadata, role badge, member since date; four real stat cards (Tickets Booked, Upcoming Events, Total Spent, Favorites); inline name editing with validation and instant context update everywhere without page reload; quick links to My Tickets and Favorites; and Logout button.

## Robustness & Startup Fix (Completed)
- [x] Part 1: Server connect-before-listen sequence in `server/src/server.js`: connects to MongoDB first via `await connectDB()`, then launches `app.listen()`.
- [x] Part 2: Mongoose connection retry loop (3 attempts with 1500ms delay) and explicit 5000ms timeouts in `server/src/config/db.js` with progress logging.
- [x] Part 3: Readiness guard middleware in `server/src/app.js` and `errorHandler.js` returning 503 Service Unavailable ("Server is waking up, please retry.") when database is not ready instead of 500. Login page UI shows friendly warning with an instant Retry button.
- [x] Part 4: `/health` reports database and Redis statuses accurately.
- [x] Part 5: Automated test suite in `server/src/scripts/testStartup.js` verifying immediate requests never return 500, /health accuracy, and smooth post-connect login ✅









