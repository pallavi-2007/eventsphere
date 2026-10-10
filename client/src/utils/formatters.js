export const formatEventDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const optionsDate = { month: 'short', day: 'numeric', year: 'numeric' };
  const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
  
  const formattedDate = date.toLocaleDateString('en-US', optionsDate);
  const formattedTime = date.toLocaleTimeString('en-US', optionsTime);
  
  return `${formattedDate} · ${formattedTime}`;
};

export const formatPriceRange = (ticketTypes) => {
  if (!ticketTypes || ticketTypes.length === 0) return 'Free';
  const prices = ticketTypes.map(t => Number(t.price) || 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  if (min === max) {
    return min === 0 ? 'Free' : `₹${min.toLocaleString('en-IN')}`;
  }
  return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
};
