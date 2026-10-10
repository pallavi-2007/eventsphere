import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatEventDate, formatPriceRange } from '../utils/formatters';
import { FavoriteButton } from '../components/FavoriteButton';
import { useFavorites } from '../context/FavoritesContext';
import {
  Heart,
  Calendar,
  MapPin,
  ArrowRight,
  Compass,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const UserFavorites = () => {
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { favoriteIds } = useFavorites();

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/favorites');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setFavoriteEvents(res.data.data);
      } else {
        setFavoriteEvents([]);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
      setError(err.response?.data?.error || 'Unable to load your saved events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Filter out any events that were un-favorited from the context
  const displayedEvents = favoriteEvents.filter((evt) =>
    favoriteIds.has(evt._id?.toString())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-plum/70">Saved Experiences</span>
          <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight mt-0.5">
            Your Favorite Events
          </h1>
          <p className="text-neutral-500 text-xs md:text-sm mt-1">
            Events you've saved for quick access, updates, and ticket checkout.
          </p>
        </div>

        <Link
          to="/user/events"
          className="inline-flex items-center gap-2 bg-cream-100 hover:bg-cream-200 text-plum font-bold text-xs px-4 py-2.5 rounded-xl transition self-start md:self-auto"
        >
          <Compass className="w-4 h-4" />
          <span>Explore All Events</span>
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-80 border border-cream-200" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Failed to load favorites</h3>
          <p className="text-xs text-rose-700 mt-1 mb-4">{error}</p>
          <button
            onClick={fetchFavorites}
            className="inline-flex items-center gap-1.5 bg-plum text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:bg-plum-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayedEvents.length === 0 && (
        <div className="bg-white rounded-3xl p-12 md:p-16 text-center border border-cream-300 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-20 h-20 rounded-full bg-cream-100 text-plum flex items-center justify-center mx-auto">
            <Heart className="w-9 h-9 opacity-50" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-plum-900">No Favorites Yet</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
              Click the heart icon on any event to bookmark it here for fast ticket booking and updates.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/user/events"
              className="inline-flex items-center gap-2 bg-plum hover:bg-plum-700 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg shadow-plum/20 transition"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Events</span>
            </Link>
          </div>
        </div>
      )}

      {/* Favorites Grid (using the exact same card style as Featured & Popular) */}
      {!loading && !error && displayedEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedEvents.map((evt) => (
            <div
              key={evt._id}
              className="group bg-white rounded-2xl overflow-hidden border border-cream-300/80 shadow-sm hover:shadow-md hover:border-plum-200 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Banner with Category & Favorite Heart */}
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

                {/* Content */}
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

              {/* Price & Book Now button */}
              <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-cream-200 mt-2">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-medium uppercase tracking-wider">
                    Starting from
                  </span>
                  <span className="font-extrabold text-sm text-plum-900">
                    {formatPriceRange(evt.ticketTypes)}
                  </span>
                </div>
                <Link
                  to={`/user/events/${evt._id}`}
                  className="bg-plum hover:bg-plum-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Book Now</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserFavorites;
