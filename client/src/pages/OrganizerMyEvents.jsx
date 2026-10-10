import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatEventDate, formatPriceRange } from '../utils/formatters';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  RefreshCw,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Loader2
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Music', 'Conferences', 'Workshops', 'Festivals', 'Comedy', 'Networking', 'Other'];

const EMPTY_TICKET = { name: '', price: '', quantity: '' };

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Music',
  dateTime: '',
  venue: '',
  bannerUrl: '',
  status: 'published',
  ticketTypes: [{ ...EMPTY_TICKET }]
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d)) return '';
  // Format: YYYY-MM-DDTHH:mm  (datetime-local input format)
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── EventForm (Create / Edit) ────────────────────────────────────────────────
const EventForm = ({ initialData, onSave, onCancel }) => {
  const isEdit = !!initialData;

  const [form, setForm] = useState(() => {
    if (!initialData) return { ...EMPTY_FORM, ticketTypes: [{ ...EMPTY_TICKET }] };
    return {
      title: initialData.title || '',
      description: initialData.description || '',
      category: initialData.category || 'Music',
      dateTime: toDatetimeLocal(initialData.dateTime),
      venue: initialData.venue || '',
      bannerUrl: initialData.bannerUrl || '',
      status: initialData.status || 'published',
      ticketTypes: (initialData.ticketTypes || []).map((t) => ({
        _id: t._id,
        name: t.name || '',
        price: t.price != null ? String(t.price) : '',
        quantity: t.quantity != null ? String(t.quantity) : '',
        remainingQuantity: t.remainingQuantity != null ? t.remainingQuantity : t.quantity,
        holdQuantity: t.holdQuantity || 0
      }))
    };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const setTicket = (idx, key, val) =>
    setForm((prev) => {
      const tiers = [...prev.ticketTypes];
      tiers[idx] = { ...tiers[idx], [key]: val };
      return { ...prev, ticketTypes: tiers };
    });

  const addTier = () =>
    setForm((prev) => ({ ...prev, ticketTypes: [...prev.ticketTypes, { ...EMPTY_TICKET }] }));

  const removeTier = (idx) =>
    setForm((prev) => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter((_, i) => i !== idx)
    }));

  const validate = () => {
    if (!form.title.trim()) return 'Event title is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (!form.dateTime) return 'Date and time are required.';
    if (!form.venue.trim()) return 'Venue is required.';
    if (form.ticketTypes.length === 0) return 'Add at least one ticket type.';
    for (const [i, t] of form.ticketTypes.entries()) {
      if (!t.name.trim()) return `Ticket tier ${i + 1}: name is required.`;
      if (t.price === '' || isNaN(Number(t.price)) || Number(t.price) < 0)
        return `Ticket tier ${i + 1}: price must be a non-negative number.`;
      if (t.quantity === '' || isNaN(Number(t.quantity)) || Number(t.quantity) < 1)
        return `Ticket tier ${i + 1}: quantity must be at least 1.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        dateTime: new Date(form.dateTime).toISOString(),
        ticketTypes: form.ticketTypes.map((t) => ({
          ...(t._id ? { _id: t._id } : {}),
          name: t.name.trim(),
          price: Number(t.price),
          quantity: Number(t.quantity),
          remainingQuantity: t.remainingQuantity != null ? Number(t.remainingQuantity) : Number(t.quantity),
          holdQuantity: Number(t.holdQuantity) || 0
        }))
      };

      if (isEdit) {
        await api.put(`/events/${initialData._id}`, payload);
      } else {
        await api.post('/events', payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-cream-200 w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-cream-200">
          <div>
            <h2 className="text-xl font-black text-plum-900">{isEdit ? 'Edit Event' : 'Create New Event'}</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Fill in the details and add ticket tiers below.</p>
          </div>
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-xl hover:bg-cream-100 flex items-center justify-center text-neutral-500 hover:text-plum transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Event Title <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Live Music Night 2026"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Description <span className="text-rose-500">*</span></label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Describe the event experience, lineup, highlights..."
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition resize-none"
            />
          </div>

          {/* Category + Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Date + Time */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Date & Time <span className="text-rose-500">*</span></label>
            <input
              type="datetime-local"
              value={form.dateTime}
              onChange={(e) => setField('dateTime', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
            />
          </div>

          {/* Venue */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Venue <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => setField('venue', e.target.value)}
              placeholder="e.g. Sardar Patel Stadium, Ahmedabad"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
            />
          </div>

          {/* Banner URL */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Banner Image URL</label>
            <input
              type="url"
              value={form.bannerUrl}
              onChange={(e) => setField('bannerUrl', e.target.value)}
              placeholder="https://... (leave blank for default)"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-50 text-sm focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
            />
            {form.bannerUrl && (
              <img
                src={form.bannerUrl}
                alt="banner preview"
                onError={(e) => { e.target.style.display = 'none'; }}
                className="mt-2 h-24 w-full object-cover rounded-xl border border-cream-200"
              />
            )}
          </div>

          {/* Ticket Types */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-700">Ticket Types <span className="text-rose-500">*</span></label>
              <button
                type="button"
                onClick={addTier}
                className="inline-flex items-center gap-1 text-xs font-bold text-plum hover:text-plum-700 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Ticket Type
              </button>
            </div>

            <div className="space-y-3">
              {form.ticketTypes.map((tier, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-cream-300 bg-cream-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-600">Tier {idx + 1}</span>
                    {form.ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(idx)}
                        className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-neutral-500 mb-1 uppercase tracking-wide">Name</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => setTicket(idx, 'name', e.target.value)}
                        placeholder="General / VIP"
                        className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 mb-1 uppercase tracking-wide">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={tier.price}
                        onChange={(e) => setTicket(idx, 'price', e.target.value)}
                        placeholder="799"
                        className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-500 mb-1 uppercase tracking-wide">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={tier.quantity}
                        onChange={(e) => setTicket(idx, 'quantity', e.target.value)}
                        placeholder="500"
                        className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum transition"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-cream-200">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-plum hover:bg-plum-700 text-white font-bold py-3 rounded-xl shadow-md shadow-plum/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /><span>{isEdit ? 'Save Changes' : 'Create Event'}</span></>
              )}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border border-cream-300 text-sm font-semibold text-neutral-600 hover:bg-cream-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────────
const DeleteConfirm = ({ event, onConfirm, onCancel, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl border border-cream-200 w-full max-w-sm p-8 space-y-5">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
        <Trash2 className="w-6 h-6" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-black text-plum-900">Delete Event?</h3>
        <p className="text-xs text-neutral-500 mt-1">
          "<span className="font-semibold">{event.title}</span>" will be permanently removed. This cannot be undone.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Delete
        </button>
        <button
          onClick={onCancel}
          className="flex-1 border border-cream-300 text-neutral-600 font-semibold py-2.5 rounded-xl text-sm hover:bg-cream-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const OrganizerMyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null); // null = create, object = edit
  const [deletingEvent, setDeletingEvent] = useState(null); // event to confirm delete
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/events/organizer/my-events');
      if (res.data?.success) {
        setEvents(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditingEvent(null);
    flash(editingEvent ? 'Event updated successfully!' : 'New event created!');
    fetchEvents();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEvent) return;
    setDeleting(true);
    try {
      await api.delete(`/events/${deletingEvent._id}`);
      setDeletingEvent(null);
      flash('Event deleted.');
      fetchEvents();
    } catch (err) {
      setDeletingEvent(null);
      setError(err.response?.data?.error || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Modals */}
      {(showForm || editingEvent) && (
        <EventForm
          initialData={editingEvent}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditingEvent(null); }}
        />
      )}
      {deletingEvent && (
        <DeleteConfirm
          event={deletingEvent}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingEvent(null)}
          deleting={deleting}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight">My Events</h1>
          <p className="text-xs text-neutral-500 mt-1">
            {loading ? 'Loading…' : `${events.length} event${events.length !== 1 ? 's' : ''} in your portfolio`}
          </p>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-plum hover:bg-plum-700 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-md shadow-plum/20 transition self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-xs text-rose-800 font-semibold mb-3">{error}</p>
          <button
            onClick={fetchEvents}
            className="inline-flex items-center gap-1.5 bg-plum text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-plum-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-24 border border-cream-200" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-cream-300 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-plum-50 text-plum flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-plum-900">No events yet</h3>
          <p className="text-xs text-neutral-500">Click "Create Event" to post your first event.</p>
          <button
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 bg-plum text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow hover:bg-plum-700"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        </div>
      )}

      {/* Event list */}
      {!loading && !error && events.length > 0 && (
        <div className="space-y-3.5">
          {events.map((evt) => (
            <div
              key={evt._id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-cream-300/80 shadow-sm hover:border-plum-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left: thumbnail + info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                  <img
                    src={evt.bannerUrl || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=200&q=80'}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm text-plum-900 truncate">{evt.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-plum-50 text-plum border border-plum-200 shrink-0">
                      {evt.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      evt.status === 'published' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      evt.status === 'draft' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}>
                      {evt.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-plum" />
                      {formatEventDate(evt.dateTime)}
                    </span>
                    <span className="hidden md:block text-neutral-300">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-plum" />
                      <span className="truncate max-w-xs">{evt.venue}</span>
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-plum-900">
                    {formatPriceRange(evt.ticketTypes)}
                    <span className="text-neutral-400 font-normal ml-1">
                      · {evt.ticketTypes?.length || 0} tier{evt.ticketTypes?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link
                  to={`/user/events/${evt._id}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Preview event page"
                  className="w-9 h-9 rounded-xl border border-cream-300 text-neutral-500 hover:text-plum hover:border-plum-200 hover:bg-plum-50 flex items-center justify-center transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => { setEditingEvent(evt); setShowForm(false); }}
                  title="Edit event"
                  className="w-9 h-9 rounded-xl border border-cream-300 text-neutral-500 hover:text-plum hover:border-plum-200 hover:bg-plum-50 flex items-center justify-center transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingEvent(evt)}
                  title="Delete event"
                  className="w-9 h-9 rounded-xl border border-cream-300 text-neutral-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
