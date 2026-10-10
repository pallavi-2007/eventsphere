import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { formatEventDate, formatPriceRange } from '../utils/formatters';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Tag, 
  ArrowRight, 
  QrCode, 
  Clock, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { FavoriteButton } from '../components/FavoriteButton';

const CATEGORIES = ['All', 'Music', 'Conferences', 'Workshops', 'Festivals', 'Comedy', 'Networking'];

export const UserHome = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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
      setError(err.response?.data?.error || 'Unable to load events at this moment. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/user/events?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Filtered for Popular Events section
  const filteredEvents = events.filter((evt) => {
    const matchesCategory = selectedCategory === 'All' || evt.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery || 
      evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      evt.venue?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Featured events (top 3)
  const featuredEvents = events.slice(0, 3);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12">
      {/* Top Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
        <div className="bg-white rounded-2xl border border-cream-300 p-2 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400 ml-3 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, artists, venues..."
            className="w-full bg-transparent text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-plum hover:bg-plum-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Sunset Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-sunset-gradient p-8 md:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide uppercase mb-4 border border-white/20">
            <span>Explore Live Experiences</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-3 text-white">
            Discover Amazing Events Near You
          </h1>
          <p className="text-white/85 text-sm md:text-base mb-6 font-normal">
            Concerts · Workshops · Conferences · Festivals · Stand-up Comedy
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/user/events"
              className="bg-white text-plum hover:bg-cream-100 font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>Explore All Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-12 -bottom-12 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-8 animate-pulse">
          <div>
            <div className="h-6 w-48 bg-cream-300 rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl h-80 border border-cream-200" />
              ))}
            </div>
          </div>
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

      {/* Featured Events Section */}
      {!loading && !error && featuredEvents.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-plum-900 tracking-tight">Featured Events</h2>
              <p className="text-xs text-neutral-500">Handpicked live experiences you don't want to miss</p>
            </div>
            <Link
              to="/user/events"
              className="text-xs font-bold text-plum hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((evt) => (
              <div
                key={evt._id}
                className="group bg-white rounded-2xl overflow-hidden border border-cream-300/80 shadow-sm hover:shadow-md hover:border-plum-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
                    <img
                      src={evt.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80'}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-plum text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                      {evt.category || 'Live Event'}
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton eventId={evt._id} />
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h3 className="font-bold text-base text-plum-900 line-clamp-1 group-hover:text-plum transition-colors">
                      {evt.title}
                    </h3>
                    
                    <div className="space-y-1.5 text-xs text-neutral-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-plum shrink-0" />
                        <span>{formatEventDate(evt.dateTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-plum shrink-0" />
                        <span className="line-clamp-1">{evt.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-cream-200 mt-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-medium uppercase tracking-wider">Starting from</span>
                    <span className="font-extrabold text-sm text-plum-900">
                      {formatPriceRange(evt.ticketTypes)}
                    </span>
                  </div>
                  <Link
                    to={`/user/events/${evt._id}`}
                    className="bg-plum hover:bg-plum-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Events with Category Chips */}
      {!loading && !error && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-plum-900 tracking-tight">Popular Events</h2>
            <p className="text-xs text-neutral-500">Filter by category to explore tailored events</p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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

          {/* Filtered Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-cream-300">
              <p className="text-sm font-semibold text-neutral-600">No events found in this category.</p>
              <p className="text-xs text-neutral-400 mt-1">Try selecting "All" or adjusting your search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((evt) => (
                <div
                  key={evt._id}
                  className="group bg-white rounded-2xl overflow-hidden border border-cream-300/80 shadow-sm hover:shadow-md hover:border-plum-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
                      <img
                        src={evt.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80'}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-plum text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        {evt.category}
                      </div>
                      <div className="absolute top-3 right-3 z-10">
                        <FavoriteButton eventId={evt._id} />
                      </div>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <h3 className="font-bold text-base text-plum-900 line-clamp-1 group-hover:text-plum transition-colors">
                        {evt.title}
                      </h3>
                      
                      <div className="space-y-1.5 text-xs text-neutral-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-plum shrink-0" />
                          <span>{formatEventDate(evt.dateTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-plum shrink-0" />
                          <span className="line-clamp-1">{evt.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-cream-200 mt-2">
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-medium uppercase tracking-wider">Tickets</span>
                      <span className="font-extrabold text-sm text-plum-900">
                        {formatPriceRange(evt.ticketTypes)}
                      </span>
                    </div>
                    <Link
                      to={`/user/events/${evt._id}`}
                      className="bg-plum hover:bg-plum-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Why Choose EventSphere Strip */}
      <section className="bg-white rounded-3xl p-8 border border-cream-300 shadow-sm">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-xl font-bold text-plum-900">Why Choose EventSphere?</h2>
          <p className="text-xs text-neutral-500 mt-1">Engineered for seamless ticketing, high concurrency, and trusted venue check-in.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-cream-100 border border-cream-200">
            <div className="w-9 h-9 rounded-xl bg-plum text-white flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-plum-900">Fake-Proof QR</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">Signed digital tickets preventing counterfeit entries.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-cream-100 border border-cream-200">
            <div className="w-9 h-9 rounded-xl bg-plum text-white flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-plum-900">5-Min Seat Hold</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">Zero double bookings guaranteed during peak drops.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-cream-100 border border-cream-200">
            <div className="w-9 h-9 rounded-xl bg-plum text-white flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-plum-900">Fast Gate Scan</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">Sub-second scan validation with duplicate attempt detection.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-cream-100 border border-cream-200">
            <div className="w-9 h-9 rounded-xl bg-plum text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-plum-900">Transparent Pricing</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">Clear tier pricing with zero hidden surcharges.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
