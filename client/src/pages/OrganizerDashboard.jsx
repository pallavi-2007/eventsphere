import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatEventDate, formatPriceRange } from '../utils/formatters';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  QrCode, 
  Plus, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  MapPin,
  Clock
} from 'lucide-react';

export const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/events/organizer/stats');
      if (res.data?.success && res.data.data) {
        setStats(res.data.data);
      } else {
        setError('Failed to retrieve organizer analytics');
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(err.response?.data?.error || 'Unable to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-plum/70">
            Organizer Portal
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight mt-0.5">
            Welcome back, {user?.name || 'Event Organizer'}!
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">
            Track your live event portfolio, schedule upcoming gatherings, and manage attendees.
          </p>
        </div>

        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-2 bg-plum hover:bg-plum-700 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md shadow-plum/20 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Manage / Create Events</span>
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-32 border border-cream-200" />
            ))}
          </div>
          <div className="bg-white rounded-2xl h-64 border border-cream-200" />
        </div>
      )}

      {/* Error Banner */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Failed to load statistics</h3>
          <p className="text-xs text-rose-700 mt-1 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 bg-plum text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:bg-plum-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Real Statistics 4-Card Grid */}
      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Events */}
            <div className="bg-white rounded-2xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Events</span>
                <div className="p-2.5 bg-plum-50 rounded-xl text-plum">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-plum-900 mb-1">{stats.totalEvents}</div>
              <div className="text-[11px] text-neutral-400">Created in your account</div>
            </div>

            {/* Total Attendees */}
            <div className="bg-white rounded-2xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Total Attendees</span>
                <div className="p-2.5 bg-plum-50 rounded-xl text-plum">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-plum-900 mb-1">{stats.totalAttendees}</div>
              <div className="text-[11px] text-neutral-400">Total tickets sold across all events</div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-2xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Upcoming Events</span>
                <div className="p-2.5 bg-plum-50 rounded-xl text-plum">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-plum-900 mb-1">{stats.upcomingEvents}</div>
              <div className="text-[11px] text-neutral-400">Scheduled from today onwards</div>
            </div>

            {/* Check-ins Today */}
            <div className="bg-white rounded-2xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-neutral-400 mb-2">
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Check-ins Today</span>
                <div className="p-2.5 bg-plum-50 rounded-xl text-plum">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-plum-900 mb-1">{stats.checkInsToday}</div>
              <div className="text-[11px] text-neutral-400">Verified at venue entrance today</div>
            </div>
          </div>

          {/* Recent Events List with View Button (Matches screen 7 in docs/ui) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-cream-200">
              <div>
                <h2 className="font-extrabold text-plum-900 text-lg">Recent Events</h2>
                <p className="text-xs text-neutral-500">Your latest created and scheduled events</p>
              </div>
              <Link
                to="/organizer/events"
                className="text-xs font-bold text-plum hover:underline flex items-center gap-1"
              >
                <span>View all events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats.recentEvents?.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                No events found. Click "Manage / Create Events" to post your first event.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentEvents.map((evt) => (
                  <div
                    key={evt._id}
                    className="p-4 rounded-2xl border border-cream-300/80 hover:border-plum-200 hover:bg-cream-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Image Thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                        <img
                          src={evt.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=200&q=80'}
                          alt={evt.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-plum-900 truncate">
                            {evt.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-plum-50 text-plum border border-plum-200 shrink-0">
                            {evt.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                          <span>{formatEventDate(evt.dateTime)}</span>
                          <span className="text-neutral-300">•</span>
                          <span className="truncate">{evt.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action: View button */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <Link
                        to={`/user/events/${evt._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-plum bg-plum-50 hover:bg-plum hover:text-white border border-plum-200 transition-all shadow-sm"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
