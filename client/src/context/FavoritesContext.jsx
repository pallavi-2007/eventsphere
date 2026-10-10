import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Load favorite IDs whenever authenticated user changes
  useEffect(() => {
    let isMounted = true;

    const loadFavoriteIds = async () => {
      if (isAuthenticated && user?.role === 'user') {
        try {
          setLoading(true);
          const res = await api.get('/favorites/ids');
          if (res.data?.success && Array.isArray(res.data.data) && isMounted) {
            setFavoriteIds(new Set(res.data.data));
          }
        } catch (err) {
          console.warn('Could not load favorite IDs:', err.message);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) setFavoriteIds(new Set());
      }
    };

    loadFavoriteIds();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.role]);

  const isFavorite = (eventId) => {
    if (!eventId) return false;
    return favoriteIds.has(eventId.toString());
  };

  const toggleFavorite = async (eventId, e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isAuthenticated || user?.role !== 'user') {
      triggerFeedback('Please sign in as an attendee to save favorites.');
      return;
    }

    if (!eventId) return;
    const strId = eventId.toString();
    const currentlyFav = favoriteIds.has(strId);

    // 1. Optimistic instant UI update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (currentlyFav) {
        next.delete(strId);
      } else {
        next.add(strId);
      }
      return next;
    });

    // 2. Perform backend sync
    try {
      if (currentlyFav) {
        await api.delete(`/favorites/${strId}`);
      } else {
        await api.post(`/favorites/${strId}`);
      }
    } catch (err) {
      console.error('Failed to update favorite:', err);
      // Rollback optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (currentlyFav) {
          next.add(strId);
        } else {
          next.delete(strId);
        }
        return next;
      });
      triggerFeedback(
        err.response?.data?.error || 'Unable to update favorites. Please try again.'
      );
    }
  };

  const triggerFeedback = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        isFavorite,
        toggleFavorite,
        loading,
        triggerFeedback
      }}
    >
      {children}

      {/* Floating feedback toast for error rollbacks */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-plum-950 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-plum-700/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
