import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { formatEventDate, formatPriceRange } from '../utils/formatters';
import { 
  Search, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  AlertCircle, 
  RefreshCw, 
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';

const CATEGORIES = ['All', 'Music', 'Conferences', 'Workshops', 'Festivals', 'Comedy', 'Networking'];

export const UserEvents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/events');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setEvents(res.data.data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err.response?.data?.error || 'Unable to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  // Filter events by category and search (title or venue)
  const filteredEvents = events.filter((evt) => {
    const matchesCategory = selectedCategory === 'All' || evt.category?.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      evt.title?.toLowerCase().includes(query) || 
      evt.venue?.toLowerCase().includes(query) ||
      evt.description?.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Search */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight">All Events</h1>
            <p className="text-xs text-neutral-500 mt-1">
              Browse upcoming experiences, conferences, concerts, and workshops
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-cream-100 text-plum rounded-full border border-cream-200 self-start sm:self-auto">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event available' : 'events available'}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search events by title, keyword, or venue..."
            className="w-full pl-12 pr-4 py-3 bg-cream-50 border border-cream-300 rounded-2xl text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-plum text-white shadow-sm ring-2 ring-plum/20'
                    : 'bg-white text-neutral-600 border border-cream-300 hover:border-plum-300 hover:bg-plum-50/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-28 border border-cream-200" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-rose-900">Failed to load events</h3>
          <p className="text-xs text-rose-700 mt-1 mb-4">{error}</p>
          <button
            onClick={fetchEvents}
            className="inline-flex items-center gap-2 bg-plum text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:bg-plum-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Events List (matching UI screen 2 layout) */}
      {!loading && !error && (
        <>
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-cream-300 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-cream-100 text-plum flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-base font-bold text-plum-900">No events matched your search</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Try searching for different terms or reset your category filter to "All".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSearchParams({});
                }}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-plum hover:underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredEvents.map((evt) => (
                <Link
                  key={evt._id}
                  to={`/user/events/${evt._id}`}
                  className="group bg-white rounded-2xl p-4 sm:p-5 border border-cream-300/80 shadow-sm hover:shadow-md hover:border-plum-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 block"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 shrink-0 relative">
                      <img
                        src={evt.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=400&q=80'}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1.5 right-1.5 z-10">
                        <FavoriteButton eventId={evt._id} size={14} className="p-1.5" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-plum-50 text-plum border border-plum-200">
                          {evt.category || 'Live Event'}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-sm sm:text-base text-plum-900 group-hover:text-plum transition-colors line-clamp-1">
                        {evt.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-plum shrink-0" />
                          <span>{formatEventDate(evt.dateTime)}</span>
                        </span>
                        <span className="hidden md:inline text-neutral-300">•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-plum shrink-0" />
                          <span className="line-clamp-1">{evt.venue}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-cream-200 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-neutral-400 block font-medium uppercase tracking-wider">Passes</span>
                      <span className="font-extrabold text-sm sm:text-base text-plum-900 block">
                        {formatPriceRange(evt.ticketTypes)}
                      </span>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-plum-50 group-hover:bg-plum group-hover:text-white text-plum flex items-center justify-center transition-all shadow-sm">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
