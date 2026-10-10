import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Ticket,
  Heart,
  DollarSign,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';

export const UserProfile = () => {
  const { user, updateUser, logout } = useAuth();

  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  // Edit name state
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    setSummaryError(null);
    try {
      const res = await api.get('/profile/summary');
      if (res.data?.success && res.data.data) {
        setSummary(res.data.data);
      } else {
        setSummaryError('Unable to load profile metrics');
      }
    } catch (err) {
      console.error('Failed to load profile summary:', err);
      setSummaryError(err.response?.data?.error || 'Failed to fetch summary data');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    }
  }, [user?.name]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Name is required.');
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 50) {
      setNameError('Name must be between 2 and 50 characters.');
      return;
    }

    setSavingName(true);
    setNameError(null);

    try {
      const res = await api.patch('/auth/me', { name: trimmed });
      if (res.data?.success && res.data.data) {
        // Update user state globally in AuthContext without page reload
        updateUser({ name: res.data.data.name });
        setIsEditing(false);
        setSuccessMessage('Profile name updated successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3500);
      }
    } catch (err) {
      console.error('Error updating name:', err);
      setNameError(err.response?.data?.error || 'Failed to update name. Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'organizer':
        return { label: 'Organizer', bg: 'bg-plum-100 text-plum border-plum-300' };
      case 'gate':
        return { label: 'Gate Staff', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'user':
      default:
        return { label: 'Attendee', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric'
      })
    : 'Recent Member';

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-plum/70">Account Settings</span>
          <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight mt-0.5">
            Attendee Profile
          </h1>
          <p className="text-neutral-500 text-xs md:text-sm mt-1">
            Manage your personal credentials, tickets, and favorite events.
          </p>
        </div>

        {successMessage && (
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Row of Four Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tickets Booked */}
        <div className="bg-white rounded-2xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Tickets Booked</span>
            <div className="p-2 bg-plum-50 rounded-xl text-plum">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-plum-900">
            {loadingSummary ? '—' : summary?.totalTickets ?? 0}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Confirmed passes</div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Upcoming Events</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-plum-900">
            {loadingSummary ? '—' : summary?.upcomingEvents ?? 0}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Scheduled ahead</div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-2xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Total Spent</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {loadingSummary ? '—' : `₹${(summary?.totalSpent ?? 0).toLocaleString('en-IN')}`}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Lifetime booking total</div>
        </div>

        {/* Favorites */}
        <div className="bg-white rounded-2xl p-5 border border-cream-300/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Favorites</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-plum-900">
            {loadingSummary ? '—' : summary?.favoritesCount ?? 0}
          </div>
          <div className="text-[10px] text-neutral-400 mt-1">Saved experiences</div>
        </div>
      </div>

      {summaryError && !loadingSummary && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3.5 rounded-2xl flex items-center justify-between">
          <span>Failed to load live metrics: {summaryError}</span>
          <button onClick={fetchSummary} className="font-bold underline hover:text-amber-950">
            Retry
          </button>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm space-y-6">
        {/* Top: Avatar, Name, Email, Role, Edit button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-cream-200">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-plum text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-plum/20 shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl md:text-2xl font-black text-plum-900 leading-tight">
                  {user?.name || 'Attendee'}
                </h2>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>{user?.email}</span>
              </p>
              <p className="text-[11px] text-neutral-400">
                Member since {memberSince}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsEditing(!isEditing);
              setNameError(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-cream-300 hover:border-plum text-plum text-xs font-bold transition self-end sm:self-auto bg-cream-50 hover:bg-white"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Name'}</span>
          </button>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form
            onSubmit={handleSaveName}
            className="p-5 rounded-2xl bg-cream-50/80 border border-cream-300/80 space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-plum-900 uppercase tracking-wider">
                Full Name
              </label>
              <span className="text-[10px] text-neutral-400">2 to 50 characters</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name..."
                disabled={savingName}
                maxLength={50}
                className="flex-1 bg-white border border-cream-300 rounded-xl px-4 py-2.5 text-xs text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-plum/30"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingName}
                  className="bg-plum hover:bg-plum-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-plum/20 transition flex items-center gap-1.5"
                >
                  {savingName && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={savingName}
                  className="border border-cream-300 hover:bg-cream-100 text-neutral-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>

            {nameError && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{nameError}</span>
              </p>
            )}
          </form>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Primary Email
            </span>
            <div className="text-sm font-bold text-neutral-800">{user?.email}</div>
            <p className="text-[11px] text-neutral-400">Used for ticket delivery & gate verification</p>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Account Security
            </span>
            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Cryptographic QR Passes Enabled</span>
            </div>
            <p className="text-[11px] text-neutral-400">Anti-counterfeit rotators protect your gate access</p>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="pt-2 border-t border-cream-200 space-y-3">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
            Quick Actions
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/user/tickets"
              className="flex items-center justify-between p-4 rounded-2xl bg-cream-50/70 hover:bg-cream-100 border border-cream-200 hover:border-plum-200 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-plum/10 text-plum flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-plum-900 group-hover:text-plum">View My Tickets</div>
                  <div className="text-[10px] text-neutral-400">Rotating entry passes & receipts</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-plum transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="/user/favorites"
              className="flex items-center justify-between p-4 rounded-2xl bg-cream-50/70 hover:bg-cream-100 border border-cream-200 hover:border-plum-200 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-plum-900 group-hover:text-plum">View Favorites</div>
                  <div className="text-[10px] text-neutral-400">Bookmarked experiences</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-plum transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t border-cream-200 flex justify-end">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out of EventSphere</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
