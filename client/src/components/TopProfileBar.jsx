import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ShieldCheck } from 'lucide-react';

export const TopProfileBar = ({ title = '' }) => {
  const { user, logout } = useAuth();

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

  const badge = getRoleBadge(user?.role);

  return (
    <header className="h-16 bg-cream border-b border-cream-300/60 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        {title && <h1 className="text-xl font-bold text-plum-900 tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center gap-4">
        {/* User profile area */}
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-cream-300 px-3.5 py-1.5 rounded-full shadow-sm">
          <div className="w-8 h-8 rounded-full bg-plum text-white font-semibold flex items-center justify-center text-sm shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-neutral-800 leading-tight">
              {user?.name || 'Demo User'}
            </div>
            <div className="text-[10px] text-neutral-500 font-medium leading-none">
              {user?.email}
            </div>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          title="Sign out of EventSphere"
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-plum hover:bg-plum-50 border border-neutral-200/80 hover:border-plum-200 px-3 py-1.5 rounded-full transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
