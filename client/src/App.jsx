import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layouts
import { OrganizerLayout } from './layouts/OrganizerLayout';
import { UserLayout } from './layouts/UserLayout';
import { GateLayout } from './layouts/GateLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { OrganizerMyEvents } from './pages/OrganizerMyEvents';
import { OrganizerAttendees } from './pages/OrganizerAttendees';
import { OrganizerCheckIns } from './pages/OrganizerCheckIns';

import { UserHome } from './pages/UserHome';
import { UserEvents } from './pages/UserEvents';
import { EventDetails } from './pages/EventDetails';
import { CheckoutPage } from './pages/CheckoutPage';
import { BookingConfirmed } from './pages/BookingConfirmed';
import { UserTickets } from './pages/UserTickets';
import { UserFavorites } from './pages/UserFavorites';
import { UserProfile } from './pages/UserProfile';

import { GateScanner } from './pages/GateScanner';

const HomeRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'organizer') {
    return <Navigate to="/organizer/dashboard" replace />;
  } else if (user.role === 'gate') {
    return <Navigate to="/gate/scanner" replace />;
  } else {
    return <Navigate to="/user/home" replace />;
  }
};

export const App = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Organizer Portal */}
      <Route
        path="/organizer"
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OrganizerDashboard />} />
        <Route path="events" element={<OrganizerMyEvents />} />
        <Route path="attendees" element={<OrganizerAttendees />} />
        <Route path="check-ins" element={<OrganizerCheckIns />} />
      </Route>

      {/* Attendee / User Portal */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<UserHome />} />
        <Route path="events" element={<UserEvents />} />
        <Route path="events/:id" element={<EventDetails />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="booking-confirmed" element={<BookingConfirmed />} />
        <Route path="tickets" element={<UserTickets />} />
        <Route path="favorites" element={<UserFavorites />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* Gate Staff Portal */}
      <Route
        path="/gate"
        element={
          <ProtectedRoute allowedRoles={['gate']}>
            <GateLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="scanner" replace />} />
        <Route path="scanner" element={<GateScanner />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
