import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-plum-300 border-t-plum rounded-full animate-spin"></div>
        <p className="mt-3 text-sm font-medium text-plum-900 tracking-wide">Loading EventSphere...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's correct home route
    if (user.role === 'organizer') {
      return <Navigate to="/organizer/dashboard" replace />;
    } else if (user.role === 'gate') {
      return <Navigate to="/gate/scanner" replace />;
    } else {
      return <Navigate to="/user/home" replace />;
    }
  }

  return children;
};
