/**
 * Utility to generate and download a clean PNG image of a ticket pass.
 * Draws without the dynamic live QR code, with a clear note explaining that
 * the live entry QR is shown securely on-screen only.
 *
 * @param {object} options
 * @param {string} options.eventTitle
 * @param {string} options.eventDate
 * @param {string} options.venue
 * @param {string} options.ticketTypeName
 * @param {string} options.ticketCode
 * @param {string} options.bookingId
 */
export const downloadTicketPass = ({
  eventTitle = 'Event',
  eventDate = '',
  venue = '',
  ticketTypeName = 'General',
  ticketCode = '',
  bookingId = ''
}) => {
  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 480;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FAF7F2'; // warm cream
  ctx.fillRect(0, 0, width, height);

  // Outer border & shadow effect
  ctx.strokeStyle = '#E8E2D9';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Header Plum Banner
  ctx.fillStyle = '#3E103F'; // brand plum
  ctx.fillRect(20, 20, width - 40, 85);

  // Brand Header Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('EventSphere Gate Pass', 45, 65);

  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#E5D4E6';
  ctx.fillText('Official Attendee Ticket Confirmation', 45, 88);

  // Status Badge on Top Right
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.roundRect(width - 165, 45, 120, 32, [8]);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CONFIRMED', width - 105, 66);
  ctx.textAlign = 'left';

  // Left Content Column (Event details)
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const displayTitle = eventTitle.length > 32 ? eventTitle.substring(0, 32) + '...' : eventTitle;
  ctx.fillText(displayTitle, 45, 160);

  // Event Date
  ctx.fillStyle = '#6B7280';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DATE & TIME', 45, 195);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(eventDate || 'Scheduled Event Date', 45, 218);

  // Venue
  ctx.fillStyle = '#6B7280';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('VENUE', 45, 255);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const displayVenue = venue.length > 38 ? venue.substring(0, 38) + '...' : venue;
  ctx.fillText(displayVenue || 'Venue information on record', 45, 278);

  // Ticket Type & Booking Ref
  ctx.fillStyle = '#6B7280';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TICKET TYPE', 45, 315);
  ctx.fillStyle = '#3E103F';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(ticketTypeName, 45, 338);

  // Divider Line
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(500, 125);
  ctx.lineTo(500, 420);
  ctx.stroke();
  ctx.setLineDash([]); // reset

  // Right Column (Ticket Code & Security Note)
  ctx.fillStyle = '#6B7280';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('BOOKING REFERENCE', 530, 155);
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(bookingId || 'EVS-REF', 530, 178);

  ctx.fillStyle = '#6B7280';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TICKET CODE', 530, 220);
  ctx.fillStyle = '#3E103F';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(ticketCode || 'TKT-PASS', 530, 245);

  // Security Box on right
  ctx.fillStyle = '#F3E8F4'; // soft plum tint
  ctx.beginPath();
  ctx.roundRect(525, 275, 235, 130, [12]);
  ctx.fill();
  ctx.strokeStyle = '#D8B4FE';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#4A1D4E';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🔒 Dynamic Entry QR', 540, 305);

  ctx.fillStyle = '#6B21A8';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const noteLines = [
    'For security & fraud prevention,',
    'live entry QR is shown only on',
    'screen with active rotation.',
    'Present your digital screen at gate.'
  ];
  let lineY = 328;
  for (const line of noteLines) {
    ctx.fillText(line, 540, lineY);
    lineY += 18;
  }

  // Footer bar on left
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('EventSphere Security System · Valid with government issued ID', 45, 415);

  // Trigger download
  const link = document.createElement('a');
  link.download = `ticket-${ticketCode || bookingId || 'pass'}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
