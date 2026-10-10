import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { TopProfileBar } from '../components/TopProfileBar';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  QrCode, 
  Ticket, 
  ShieldCheck 
} from 'lucide-react';

export const OrganizerLayout = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/organizer/dashboard', icon: LayoutDashboard },
    { name: 'My Events', path: '/organizer/events', icon: CalendarDays },
    { name: 'Attendees', path: '/organizer/attendees', icon: Users },
    { name: 'Check-ins', path: '/organizer/check-ins', icon: QrCode },
  ];

  const currentTitle = navItems.find(item => item.path === location.pathname)?.name || 'Organizer Portal';

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-cream-300/80 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          {/* Logo & Brand */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-cream-200">
            <div className="w-9 h-9 rounded-xl bg-plum flex items-center justify-center text-white shadow-sm shadow-plum/20">
              <Ticket className="w-5 h-5 rotate-45" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-plum tracking-tight leading-none block">
                EventSphere
              </span>
              <span className="text-[10px] text-neutral-400 font-medium tracking-wide uppercase">
                Organizer Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-plum text-white shadow-md shadow-plum/25'
                        : 'text-neutral-600 hover:text-plum hover:bg-plum-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Left Badge */}
        <div className="p-4 m-3 bg-cream-100 rounded-2xl border border-cream-300/60">
          <div className="flex items-center gap-1.5 text-plum font-bold text-[11px] mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-plum" />
            <span>EventSphere</span>
          </div>
          <p className="text-[10.5px] leading-relaxed text-neutral-500 font-medium">
            EventSphere · Secure · Scalable · Built for Real Events
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopProfileBar title={currentTitle} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-cream">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
