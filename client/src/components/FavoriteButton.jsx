import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

/**
 * FavoriteButton
 * Reusable heart button for event cards and event banners.
 * Filled plum heart when saved, outline when not.
 * Prevents parent navigation/clicks.
 *
 * @param {string} eventId
 * @param {string} className
 * @param {number} size
 */
export const FavoriteButton = ({ eventId, className = '', size = 18 }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(eventId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(eventId, e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
      title={saved ? 'Remove from favorites' : 'Add to favorites'}
      className={`p-2 rounded-full transition-all flex items-center justify-center focus:outline-none ${
        saved
          ? 'bg-plum text-white shadow-md shadow-plum/30 hover:bg-plum-700'
          : 'bg-white/90 backdrop-blur-sm text-neutral-500 hover:text-plum hover:bg-white shadow-sm'
      } ${className}`}
    >
      <Heart
        size={size}
        className={`transition-transform active:scale-75 ${
          saved ? 'fill-current text-white stroke-white' : 'stroke-current hover:scale-110'
        }`}
      />
    </button>
  );
};

export default FavoriteButton;
