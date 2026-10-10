import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopProfileBar } from '../components/TopProfileBar';
import { QrCode, ShieldCheck } from 'lucide-react';

export const GateLayout = () => {
  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <header className="h-16 bg-white border-b border-cream-300 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-plum flex items-center justify-center text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-plum tracking-tight leading-none block">
                EventSphere
              </span>
              <span className="text-[10px] text-neutral-400 font-semibold tracking-wide uppercase">
                Gate Staff Scanner
              </span>
            </div>
          </div>

          <TopProfileBar />
        </header>

        {/* Main Content */}
        <main className="p-6 md:p-10 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Footer / Badge */}
      <footer className="p-6 border-t border-cream-300/60 bg-cream-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-plum" />
          <span>EventSphere · Secure · Scalable · Built for Real Events</span>
        </div>
        <div className="text-xs text-neutral-400">
          Gate Check-in Station #1
        </div>
      </footer>
    </div>
  );
};
